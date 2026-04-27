import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as PDFDocument from 'pdfkit';
import {
  SentimentReport,
  SentimentPost,
  SentimentEmotion,
  SentimentWordCloud,
  SentimentShare,
  SentimentReportStatus,
  ReportType,
  SharePermission,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ActionType, ModuleType } from '../../common/enums';
import { ModashRawService } from '../discovery/services/modash-raw.service';
import {
  CreateSentimentReportDto,
  UpdateSentimentReportDto,
  ShareSentimentReportDto,
  SentimentReportFilterDto,
  SentimentReportListResponseDto,
  SentimentReportDetailDto,
  DashboardStatsDto,
} from './dto';

const CREDIT_PER_URL = 1;
const CREDIT_PER_RETRY = 1;

@Injectable()
export class SentimentsService {
  private readonly logger = new Logger(SentimentsService.name);

  constructor(
    @InjectRepository(SentimentReport)
    private readonly reportRepo: Repository<SentimentReport>,
    @InjectRepository(SentimentPost)
    private readonly postRepo: Repository<SentimentPost>,
    @InjectRepository(SentimentEmotion)
    private readonly emotionRepo: Repository<SentimentEmotion>,
    @InjectRepository(SentimentWordCloud)
    private readonly wordCloudRepo: Repository<SentimentWordCloud>,
    @InjectRepository(SentimentShare)
    private readonly shareRepo: Repository<SentimentShare>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly creditsService: CreditsService,
    private readonly modashRawService: ModashRawService,
  ) {}

  /**
   * Create a new sentiment report
   * Requires credits: 1 credit per URL
   */
  async createReport(userId: string, dto: CreateSentimentReportDto): Promise<{ success: boolean; reports: SentimentReport[]; creditsUsed: number }> {
    const urlCount = dto.urls.length;
    const totalCredits = urlCount * CREDIT_PER_URL;

    // Validate balance upfront but defer deduction until after success (universal refresh guard)
    const balance = await this.creditsService.getBalance(userId);
    if ((balance.unifiedBalance || 0) < totalCredits) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${totalCredits}, Available: ${balance.unifiedBalance}`,
      );
    }

    const reports: SentimentReport[] = [];

    for (const url of dto.urls) {
      const report = new SentimentReport();
      report.title = dto.title || 'Untitled Sentiment Report';
      report.reportType = dto.reportType;
      report.platform = dto.platform;
      report.targetUrl = url;
      report.status = SentimentReportStatus.PENDING;
      report.ownerId = userId;
      report.createdById = userId;
      report.shareUrlToken = `sent_share_${uuidv4().substring(0, 8)}`;
      report.creditsUsed = CREDIT_PER_URL;

      if (dto.deepBrandAnalysis) {
        report.deepBrandAnalysis = true;
        report.brandName = dto.brandName;
        report.brandUsername = dto.brandUsername;
        report.productName = dto.productName;
      }

      report.influencerUsername = this.extractUsernameFromUrl(url, dto.platform);
      report.influencerName =
        report.influencerUsername !== 'unknown' ? `@${report.influencerUsername}` : 'Influencer';

      const savedReport = await this.reportRepo.save(report);
      reports.push(savedReport);

      // Trigger processing (in real app, this would be a background job)
      setTimeout(() => this.processReport(savedReport.id), 2000);
    }

    return { success: true, reports, creditsUsed: totalCredits };
  }

  /**
   * Extract handle / username from profile or post URL (best-effort).
   */
  private extractUsernameFromUrl(url: string, platform: string): string {
    const p = (platform || '').toUpperCase();
    if (p === 'TIKTOK') {
      const m = url.match(/tiktok\.com\/@?([^\/\?]+)/i);
      return m ? m[1] : 'unknown';
    }
    const ig = url.match(/instagram\.com\/(?:p\/|reel\/|stories\/)?([^\/\?]+)/i);
    return ig ? ig[1] : 'unknown';
  }

  /**
   * Process report: dispatches to Raw-API or simulated flow depending on config + report type.
   */
  private async processReport(reportId: string): Promise<void> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) return;

    try {
      report.status = SentimentReportStatus.AGGREGATING;
      await this.reportRepo.save(report);

      report.status = SentimentReportStatus.IN_PROCESS;
      await this.reportRepo.save(report);

      report.influencerUsername = this.extractUsernameFromUrl(report.targetUrl, report.platform);
      if (report.influencerUsername !== 'unknown') {
        report.influencerName = `@${report.influencerUsername}`;
      }

      if (this.modashRawService.isRawApiEnabled()) {
        if (report.reportType === ReportType.PROFILE) {
          await this.processProfileReportWithRawApi(report);
        } else {
          await this.processReportWithRawApi(report);
        }
      } else if (report.reportType === ReportType.PROFILE) {
        await this.simulateProfileProcessing(report);
      } else {
        await this.simulateSinglePostProcessing(report);
      }

      if ((report.status as string) === SentimentReportStatus.FAILED) {
        this.logger.error(`Sentiment report ${reportId} failed — NO credits charged`);
        return;
      }

      report.status = SentimentReportStatus.COMPLETED;
      report.completedAt = new Date();
      await this.reportRepo.save(report);

      await this.creditsService.deductCredits(report.ownerId, {
        actionType: ActionType.REPORT_GENERATION,
        quantity: CREDIT_PER_URL,
        module: ModuleType.SOCIAL_SENTIMENTS,
        resourceId: reportId,
        resourceType: 'sentiment_report_creation',
      });
      this.logger.log(`Sentiment report ${reportId}: charged ${CREDIT_PER_URL} credits after success`);
    } catch (error) {
      report.status = SentimentReportStatus.FAILED;
      report.errorMessage = error.message || 'Processing failed';
      await this.reportRepo.save(report);
      this.logger.error(`Sentiment report ${reportId} failed — NO credits charged`);
    }
  }

  private async processReportWithRawApi(report: SentimentReport): Promise<void> {
    this.logger.log(`Processing sentiments via Modash Raw API for report ${report.id}`);

    const mediaId = this.extractMediaIdFromUrl(report.targetUrl, report.platform);

    if (!mediaId || mediaId === 'unknown') {
      report.status = SentimentReportStatus.FAILED;
      report.errorMessage = 'Could not extract valid media ID from URL. Ensure the URL points to a specific post/reel/video.';
      await this.reportRepo.save(report);
      return;
    }

    const comments = await this.fetchCommentsForMedia(report, mediaId);
    if (report.status === SentimentReportStatus.FAILED) return;

    await this.analyzeAndSaveComments(report, report.targetUrl, mediaId, comments);
  }

  /**
   * Process a PROFILE-type report via Raw API: fetch recent posts, then aggregate comments.
   */
  private async processProfileReportWithRawApi(report: SentimentReport): Promise<void> {
    this.logger.log(`Processing profile sentiments via Modash Raw API for report ${report.id}`);

    const username = report.influencerUsername || this.extractUsernameFromUrl(report.targetUrl, report.platform);
    if (!username || username === 'unknown') {
      report.status = SentimentReportStatus.FAILED;
      report.errorMessage = 'Could not extract username from profile URL.';
      await this.reportRepo.save(report);
      return;
    }

    const plat = (report.platform || '').toUpperCase();
    const recentPosts: Array<{ id: string; url: string }> = [];

    try {
      if (plat === 'INSTAGRAM' || plat === 'INSTA') {
        const feed = await this.modashRawService.getIgUserFeed(username);
        for (const post of (feed.data || []).slice(0, 6)) {
          recentPosts.push({
            id: post.id || post.code,
            url: `https://www.instagram.com/p/${post.code}/`,
          });
        }
      } else if (plat === 'TIKTOK') {
        const feed = await this.modashRawService.getTiktokUserFeed(username);
        for (const post of (feed.data || []).slice(0, 6)) {
          recentPosts.push({
            id: post.id,
            url: `https://www.tiktok.com/@${username}/video/${post.id}`,
          });
        }
      } else if (plat === 'YOUTUBE') {
        const feed = await this.modashRawService.getYoutubeUploadedVideos(username);
        for (const vid of (feed.data || []).slice(0, 6)) {
          recentPosts.push({
            id: vid.videoId,
            url: `https://www.youtube.com/watch?v=${vid.videoId}`,
          });
        }
      }
    } catch (err) {
      this.logger.error(`Raw API error fetching feed for ${username}: ${err.message}`);
      report.status = SentimentReportStatus.FAILED;
      report.errorMessage = `Failed to fetch recent posts: ${err.message}`;
      await this.reportRepo.save(report);
      return;
    }

    if (recentPosts.length === 0) {
      report.status = SentimentReportStatus.FAILED;
      report.errorMessage = 'No recent posts found for this profile.';
      await this.reportRepo.save(report);
      return;
    }

    let weightedPos = 0;
    let weightedNeu = 0;
    let weightedNeg = 0;
    let totalComments = 0;

    for (const rp of recentPosts) {
      const comments = await this.fetchCommentsForMedia(report, rp.id);
      if (report.status === SentimentReportStatus.FAILED) return;
      if (comments.length === 0) continue;

      const result = await this.analyzeAndSaveComments(report, rp.url, rp.id, comments);
      const count = result.total;
      weightedPos += result.positivePct * count;
      weightedNeu += result.neutralPct * count;
      weightedNeg += result.negativePct * count;
      totalComments += count;
    }

    if (totalComments > 0) {
      report.positivePercentage = Number((weightedPos / totalComments).toFixed(2));
      report.neutralPercentage = Number((weightedNeu / totalComments).toFixed(2));
      report.negativePercentage = Number((weightedNeg / totalComments).toFixed(2));
      report.overallSentimentScore =
        report.positivePercentage * 1.2 - report.negativePercentage * 0.5 + 20;
    } else {
      report.positivePercentage = 0;
      report.neutralPercentage = 0;
      report.negativePercentage = 0;
      report.overallSentimentScore = 0;
    }
  }

  /**
   * Fetch comments for a single media item across platforms.
   * Sets report.status to FAILED on API error (caller must check).
   */
  private async fetchCommentsForMedia(
    report: SentimentReport,
    mediaId: string,
  ): Promise<Array<{ text: string; author: string; likes: number }>> {
    const comments: Array<{ text: string; author: string; likes: number }> = [];
    try {
      const plat = (report.platform || '').toUpperCase();
      if (plat === 'INSTAGRAM' || plat === 'INSTA') {
        const result = await this.modashRawService.getIgMediaComments(mediaId);
        for (const c of result.data || []) {
          comments.push({ text: c.text, author: c.user?.username || '', likes: c.comment_like_count || 0 });
        }
      } else if (plat === 'TIKTOK') {
        const result = await this.modashRawService.getTiktokComments(mediaId);
        for (const c of result.data || []) {
          comments.push({ text: c.text, author: c.user?.unique_id || '', likes: c.digg_count || 0 });
        }
      } else if (plat === 'YOUTUBE') {
        const result = await this.modashRawService.getYoutubeVideoComments(mediaId);
        for (const c of result.data || []) {
          comments.push({ text: c.text, author: c.authorDisplayName || '', likes: c.likeCount || 0 });
        }
      }
    } catch (err) {
      this.logger.error(`Raw API error for sentiment report ${report.id}, media ${mediaId}: ${err.message}`);
      report.status = SentimentReportStatus.FAILED;
      report.errorMessage = `Failed to fetch comments from platform: ${err.message}`;
      await this.reportRepo.save(report);
    }
    return comments;
  }

  /**
   * Analyze comment sentiments and persist post + word-cloud rows.
   * Returns aggregate percentages so the caller can weight across posts.
   */
  private async analyzeAndSaveComments(
    report: SentimentReport,
    postUrl: string,
    mediaId: string,
    comments: Array<{ text: string; author: string; likes: number }>,
  ): Promise<{ positivePct: number; neutralPct: number; negativePct: number; total: number }> {
    if (comments.length === 0) {
      return { positivePct: 0, neutralPct: 0, negativePct: 0, total: 0 };
    }

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    const wordFreq = new Map<string, number>();

    for (const comment of comments) {
      const sentiment = this.analyzeCommentSentiment(comment.text);
      if (sentiment > 0.2) positiveCount++;
      else if (sentiment < -0.2) negativeCount++;
      else neutralCount++;

      const words = comment.text.toLowerCase().replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
      for (const word of words) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    const total = comments.length;
    const positivePct = (positiveCount / total) * 100;
    const neutralPct = (neutralCount / total) * 100;
    const negativePct = (negativeCount / total) * 100;

    const score = positivePct * 1.2 - negativePct * 0.5 + 20;

    report.overallSentimentScore = score;
    report.positivePercentage = Number(positivePct.toFixed(2));
    report.neutralPercentage = Number(neutralPct.toFixed(2));
    report.negativePercentage = Number(negativePct.toFixed(2));

    const post = new SentimentPost();
    post.reportId = report.id;
    post.postId = mediaId;
    post.postUrl = postUrl;
    post.description = `Analyzed ${total} real comments`;
    post.commentsCount = total;
    post.commentsAnalyzed = total;
    post.sentimentScore = score;
    post.positivePercentage = Number(positivePct.toFixed(2));
    post.neutralPercentage = Number(neutralPct.toFixed(2));
    post.negativePercentage = Number(negativePct.toFixed(2));
    post.postDate = new Date();
    const savedPost = await this.postRepo.save(post);

    await this.saveEmotionsForPost(report.id, savedPost.id, total);

    const topWords = [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
    for (const [word, count] of topWords) {
      const wc = new SentimentWordCloud();
      wc.reportId = report.id;
      wc.postId = savedPost.id;
      wc.word = word;
      wc.frequency = count;
      wc.sentiment = count > total * 0.1 ? 'positive' : 'neutral';
      await this.wordCloudRepo.save(wc);
    }

    return { positivePct, neutralPct, negativePct, total };
  }

  private analyzeCommentSentiment(text: string): number {
    const positiveWords = ['love', 'great', 'amazing', 'awesome', 'beautiful', 'best', 'good', 'excellent', 'perfect', 'wonderful', 'fantastic', 'incredible', 'like', 'happy', 'thank', 'fire', 'nice', 'cool', 'inspo'];
    const negativeWords = ['hate', 'bad', 'terrible', 'worst', 'ugly', 'horrible', 'awful', 'poor', 'stupid', 'boring', 'fake', 'scam', 'trash', 'cringe', 'disappointing', 'disgusting'];
    const lower = text.toLowerCase();
    let score = 0;
    for (const w of positiveWords) { if (lower.includes(w)) score += 0.3; }
    for (const w of negativeWords) { if (lower.includes(w)) score -= 0.4; }
    return Math.max(-1, Math.min(1, score));
  }

  private extractMediaIdFromUrl(url: string, platform: string): string {
    const plat = (platform || '').toUpperCase();
    if (plat === 'INSTAGRAM' || plat === 'INSTA') {
      const m = url.match(/instagram\.com\/(?:p|reel)\/([^\/\?]+)/i);
      return m ? m[1] : 'unknown';
    }
    if (plat === 'TIKTOK') {
      const m = url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/i);
      return m ? m[1] : 'unknown';
    }
    if (plat === 'YOUTUBE') {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?]+)/i);
      return m ? m[1] : 'unknown';
    }
    return 'unknown';
  }

  /** One URL = one post (legacy simulated flow). */
  private async simulateSinglePostProcessing(report: SentimentReport): Promise<void> {
    const reportId = report.id;
    const positive = Math.random() * 50 + 30;
    const neutral = Math.random() * 30 + 10;
    const negative = 100 - positive - neutral;

    report.overallSentimentScore = positive * 1.2 - negative * 0.5 + 20;
    report.positivePercentage = Number(positive.toFixed(2));
    report.neutralPercentage = Number(neutral.toFixed(2));
    report.negativePercentage = Number(negative.toFixed(2));

    const post = new SentimentPost();
    post.reportId = reportId;
    post.postId = `post_${Date.now()}`;
    post.postUrl = report.targetUrl;
    post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
    post.description = 'Sample post description with #hashtags and @mentions';
    post.likesCount = Math.floor(Math.random() * 10000) + 1000;
    post.commentsCount = Math.floor(Math.random() * 500) + 50;
    post.viewsCount = Math.floor(Math.random() * 50000) + 5000;
    post.engagementRate = ((post.likesCount + post.commentsCount) / 50000) * 100;
    post.sentimentScore = report.overallSentimentScore;
    post.positivePercentage = report.positivePercentage;
    post.neutralPercentage = report.neutralPercentage;
    post.negativePercentage = report.negativePercentage;
    post.commentsAnalyzed = post.commentsCount;
    post.postDate = new Date();

    const savedPost = await this.postRepo.save(post);
    await this.saveEmotionsForPost(reportId, savedPost.id, post.commentsCount);
    await this.saveWordCloudForPost(reportId, savedPost.id);
  }

  /**
   * Simulates fetching recent posts from a profile URL and aggregates sentiment (weighted by comment volume).
   */
  private async simulateProfileProcessing(report: SentimentReport): Promise<void> {
    const reportId = report.id;
    const base = report.targetUrl.replace(/\/$/, '');
    const recentPostCount = 6;
    let weightedPos = 0;
    let weightedNeu = 0;
    let weightedNeg = 0;
    let totalComments = 0;

    for (let i = 0; i < recentPostCount; i++) {
      const positive = Math.random() * 45 + 25;
      const neutral = Math.random() * 28 + 12;
      const negative = Math.max(0, 100 - positive - neutral);

      const post = new SentimentPost();
      post.reportId = reportId;
      post.postId = `profile_post_${reportId}_${i}_${Date.now()}`;
      post.postUrl = `${base}/p/sim_${i + 1}_${uuidv4().substring(0, 6)}`;
      post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + i}`;
      post.description = `Recent post ${i + 1} from profile — simulated caption with #hashtags`;
      post.likesCount = Math.floor(Math.random() * 8000) + 200;
      post.commentsCount = Math.floor(Math.random() * 400) + 20;
      post.viewsCount = Math.floor(Math.random() * 40000) + 2000;
      post.engagementRate = ((post.likesCount + post.commentsCount) / Math.max(1, post.viewsCount)) * 100;
      post.sentimentScore = positive * 1.1 - negative * 0.4 + 15;
      post.positivePercentage = Number(positive.toFixed(2));
      post.neutralPercentage = Number(neutral.toFixed(2));
      post.negativePercentage = Number(negative.toFixed(2));
      post.commentsAnalyzed = post.commentsCount;
      post.postDate = new Date(Date.now() - i * 86400000 * 2);

      await this.postRepo.save(post);

      const w = Number(post.commentsCount) || 0;
      totalComments += w;
      weightedPos += positive * w;
      weightedNeu += neutral * w;
      weightedNeg += negative * w;
    }

    const tw = totalComments || 1;
    report.positivePercentage = Number((weightedPos / tw).toFixed(2));
    report.neutralPercentage = Number((weightedNeu / tw).toFixed(2));
    report.negativePercentage = Number((weightedNeg / tw).toFixed(2));
    report.overallSentimentScore =
      report.positivePercentage * 1.2 - report.negativePercentage * 0.5 + 15;

    await this.saveAggregatedEmotions(reportId, totalComments);
    await this.saveAggregatedWordCloud(reportId);
  }

  private async saveEmotionsForPost(reportId: string, postId: string, commentsCount: number): Promise<void> {
    const emotions = ['love', 'joy', 'admiration', 'neutral', 'disappointment', 'anger'];
    let remainingPercentage = 100;
    for (let i = 0; i < emotions.length; i++) {
      const emotion = new SentimentEmotion();
      emotion.reportId = reportId;
      emotion.postId = postId;
      emotion.emotion = emotions[i];
      if (i === emotions.length - 1) {
        emotion.percentage = remainingPercentage;
      } else {
        emotion.percentage = Math.floor(Math.random() * (remainingPercentage / 2));
        remainingPercentage -= emotion.percentage;
      }
      emotion.count = Math.floor((emotion.percentage * commentsCount) / 100);
      await this.emotionRepo.save(emotion);
    }
  }

  private async saveWordCloudForPost(reportId: string, postId: string): Promise<void> {
    const words = ['amazing', 'love', 'beautiful', 'great', 'awesome', 'good', 'nice', 'perfect', 'bad', 'poor'];
    const sentiments = ['POSITIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'POSITIVE', 'NEGATIVE', 'NEGATIVE'];
    for (let i = 0; i < words.length; i++) {
      const wordCloud = new SentimentWordCloud();
      wordCloud.reportId = reportId;
      wordCloud.postId = postId;
      wordCloud.word = words[i];
      wordCloud.frequency = Math.floor(Math.random() * 100) + 20;
      wordCloud.sentiment = sentiments[i];
      await this.wordCloudRepo.save(wordCloud);
    }
  }

  /** Report-level emotions after profile aggregation (postId omitted). */
  private async saveAggregatedEmotions(reportId: string, totalComments: number): Promise<void> {
    const emotions = ['love', 'joy', 'admiration', 'neutral', 'disappointment', 'anger'];
    let remainingPercentage = 100;
    const tc = Math.max(1, totalComments);
    for (let i = 0; i < emotions.length; i++) {
      const emotion = new SentimentEmotion();
      emotion.reportId = reportId;
      emotion.emotion = emotions[i];
      if (i === emotions.length - 1) {
        emotion.percentage = remainingPercentage;
      } else {
        emotion.percentage = Math.floor(Math.random() * (remainingPercentage / 2));
        remainingPercentage -= emotion.percentage;
      }
      emotion.count = Math.floor((emotion.percentage * tc) / 100);
      await this.emotionRepo.save(emotion);
    }
  }

  private async saveAggregatedWordCloud(reportId: string): Promise<void> {
    const words = ['amazing', 'love', 'beautiful', 'great', 'awesome', 'good', 'nice', 'perfect', 'bad', 'poor'];
    const sentiments = ['POSITIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'POSITIVE', 'NEGATIVE', 'NEGATIVE'];
    for (let i = 0; i < words.length; i++) {
      const wordCloud = new SentimentWordCloud();
      wordCloud.reportId = reportId;
      wordCloud.word = `${words[i]}_all`;
      wordCloud.frequency = Math.floor(Math.random() * 120) + 40;
      wordCloud.sentiment = sentiments[i];
      await this.wordCloudRepo.save(wordCloud);
    }
  }

  /**
   * Get list of reports with filters
   */
  async getReports(userId: string, filters: SentimentReportFilterDto): Promise<SentimentReportListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepo.createQueryBuilder('report');

    // Filter by created by
    if (filters.createdBy === 'ME') {
      queryBuilder.where('report.createdById = :userId', { userId });
    } else if (filters.createdBy === 'TEAM') {
      const teamUserIds = await this.getTeamUserIds(userId);
      queryBuilder.where('report.createdById IN (:...teamUserIds)', { teamUserIds });
    } else {
      const teamUserIds = await this.getTeamUserIds(userId);
      queryBuilder.where(
        '(report.createdById = :userId OR report.createdById IN (:...teamUserIds))',
        { userId, teamUserIds }
      );
    }

    // Filter by platform
    if (filters.platform && filters.platform !== 'ALL') {
      queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
    }

    // Filter by report type
    if (filters.reportType) {
      queryBuilder.andWhere('report.reportType = :reportType', { reportType: filters.reportType });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    // Search
    if (filters.search) {
      queryBuilder.andWhere(
        '(LOWER(report.title) LIKE :search OR LOWER(report.influencerName) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` }
      );
    }

    queryBuilder.orderBy('report.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [reports, total] = await queryBuilder.getManyAndCount();

    return {
      reports: reports.map(r => this.toSummaryDto(r)),
      total,
      page,
      limit,
      hasMore: skip + reports.length < total,
    };
  }

  /**
   * Get report by ID
   */
  async getReportById(userId: string, reportId: string): Promise<SentimentReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    // Get emotions and word cloud
    const emotions = await this.emotionRepo.find({ where: { reportId } });
    const wordCloud = await this.wordCloudRepo.find({ where: { reportId } });

    return this.toDetailDto(report, emotions, wordCloud);
  }

  /**
   * Get report by share token
   */
  async getReportByShareToken(token: string): Promise<SentimentReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found or not publicly shared');
    }

    const emotions = await this.emotionRepo.find({ where: { reportId: report.id } });
    const wordCloud = await this.wordCloudRepo.find({ where: { reportId: report.id } });

    return this.toDetailDto(report, emotions, wordCloud);
  }

  /**
   * Update report
   */
  async updateReport(userId: string, reportId: string, dto: UpdateSentimentReportDto): Promise<{ success: boolean; report: SentimentReport }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (dto.title !== undefined) report.title = dto.title;
    if (dto.isPublic !== undefined) report.isPublic = dto.isPublic;

    const savedReport = await this.reportRepo.save(report);

    return { success: true, report: savedReport };
  }

  async retryReport(
    userId: string,
    reportId: string,
  ): Promise<{ success: boolean; report: SentimentReport; creditsUsed: number }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    await this.checkReportAccess(userId, report, 'edit');

    if (report.status !== SentimentReportStatus.FAILED) {
      throw new BadRequestException('Only failed reports can be retried');
    }

    // Validate balance upfront but defer deduction until after success (universal refresh guard)
    const balanceCheck = await this.creditsService.getBalance(userId);
    if (balanceCheck.unifiedBalance < CREDIT_PER_RETRY) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${CREDIT_PER_RETRY}, Available: ${balanceCheck.unifiedBalance}`,
      );
    }

    report.status = SentimentReportStatus.PENDING;
    report.errorMessage = undefined;
    report.completedAt = undefined;
    const saved = await this.reportRepo.save(report);

    // Credits deducted only on success inside processReport
    setTimeout(() => this.processReport(saved.id), 2000);

    return { success: true, report: saved, creditsUsed: CREDIT_PER_RETRY };
  }

  async deleteReport(userId: string, reportId: string): Promise<{ success: boolean }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    await this.reportRepo.remove(report);

    return { success: true };
  }

  /**
   * Bulk delete reports
   */
  async bulkDeleteReports(userId: string, reportIds: string[]): Promise<{ success: boolean; deleted: number }> {
    let deleted = 0;
    for (const reportId of reportIds) {
      try {
        await this.deleteReport(userId, reportId);
        deleted++;
      } catch (err) {
        // Skip reports user can't delete
      }
    }
    return { success: true, deleted };
  }

  /**
   * Share report
   */
  async shareReport(userId: string, reportId: string, dto: ShareSentimentReportDto): Promise<{ success: boolean; shareUrl?: string }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (dto.sharedWithUserId) {
      const share = new SentimentShare();
      share.reportId = reportId;
      share.sharedWithUserId = dto.sharedWithUserId;
      share.sharedByUserId = userId;
      share.permissionLevel = dto.permissionLevel || SharePermission.VIEW;
      await this.shareRepo.save(share);
    }

    // Make public for link sharing
    report.isPublic = true;
    await this.reportRepo.save(report);

    const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/sentiments/shared/${report.shareUrlToken}`;

    return { success: true, shareUrl };
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(userId: string): Promise<DashboardStatsDto> {
    const teamUserIds = await this.getTeamUserIds(userId);

    const allReports = await this.reportRepo.find({
      where: { createdById: In([userId, ...teamUserIds]) },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedReports = allReports.filter(r => r.status === SentimentReportStatus.COMPLETED);

    const avgScore = completedReports.length > 0
      ? completedReports.reduce((sum, r) => sum + (Number(r.overallSentimentScore) || 0), 0) / completedReports.length
      : 0;

    return {
      totalReports: allReports.length,
      completedReports: completedReports.length,
      processingReports: allReports.filter(r => 
        r.status === SentimentReportStatus.IN_PROCESS || r.status === SentimentReportStatus.AGGREGATING
      ).length,
      pendingReports: allReports.filter(r => r.status === SentimentReportStatus.PENDING).length,
      failedReports: allReports.filter(r => r.status === SentimentReportStatus.FAILED).length,
      reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
      avgSentimentScore: Number(avgScore.toFixed(2)),
    };
  }

  /**
   * Generate PDF report
   */
  async generatePdf(userId: string, reportId: string): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    if (report.status !== SentimentReportStatus.COMPLETED) {
      throw new BadRequestException('Report must be completed to download PDF');
    }

    const emotions = await this.emotionRepo.find({ where: { reportId } });
    const wordCloud = await this.wordCloudRepo.find({ where: { reportId } });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const filename = `${report.title.replace(/[^a-z0-9]/gi, '_')}_sentiment_report.pdf`;
          resolve({ buffer, filename });
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(24).fillColor('#7C3AED').text('Social Sentiments Report', { align: 'center' });
        doc.moveDown();
        
        // Report Info
        doc.fontSize(18).fillColor('#1F2937').text(report.title);
        doc.fontSize(12).fillColor('#6B7280');
        doc.text(`Platform: ${report.platform}`);
        doc.text(`Type: ${report.reportType}`);
        doc.text(`Influencer: ${report.influencerName || 'Unknown'} (@${report.influencerUsername || 'unknown'})`);
        doc.text(`Created: ${report.createdAt.toLocaleDateString()}`);
        doc.text(`Completed: ${report.completedAt?.toLocaleDateString() || 'N/A'}`);
        doc.moveDown();

        // Deep Brand Analysis
        if (report.deepBrandAnalysis) {
          doc.fontSize(14).fillColor('#7C3AED').text('Deep Brand Analysis');
          doc.fontSize(12).fillColor('#1F2937');
          doc.text(`Brand: ${report.brandName || 'N/A'}`);
          doc.text(`Brand Username: @${report.brandUsername || 'N/A'}`);
          doc.text(`Product: ${report.productName || 'N/A'}`);
          doc.moveDown();
        }

        // Sentiment Scores
        doc.fontSize(16).fillColor('#1F2937').text('Sentiment Analysis', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(14).fillColor('#7C3AED').text(`Overall Score: ${report.overallSentimentScore?.toFixed(1)}%`);
        doc.moveDown(0.3);
        
        doc.fontSize(12);
        doc.fillColor('#10B981').text(`Positive: ${report.positivePercentage?.toFixed(1)}%`);
        doc.fillColor('#6B7280').text(`Neutral: ${report.neutralPercentage?.toFixed(1)}%`);
        doc.fillColor('#EF4444').text(`Negative: ${report.negativePercentage?.toFixed(1)}%`);
        doc.moveDown();

        // Emotions Distribution
        if (emotions.length > 0) {
          doc.fontSize(16).fillColor('#1F2937').text('Emotions Distribution', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).fillColor('#374151');
          emotions.forEach(e => {
            doc.text(`${e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1)}: ${e.percentage.toFixed(1)}% (${e.count} comments)`);
          });
          doc.moveDown();
        }

        // Word Cloud (as text list)
        if (wordCloud.length > 0) {
          doc.fontSize(16).fillColor('#1F2937').text('Most Used Words', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).fillColor('#374151');
          const sortedWords = [...wordCloud].sort((a, b) => b.frequency - a.frequency);
          const topWords = sortedWords.slice(0, 15).map(w => `${w.word} (${w.frequency})`).join(', ');
          doc.text(topWords);
          doc.moveDown();
        }

        // Posts
        const posts = report.posts || [];
        if (posts.length > 0) {
          doc.addPage();
          doc.fontSize(16).fillColor('#1F2937').text('Analyzed Posts', { underline: true });
          doc.moveDown(0.5);
          
          posts.forEach((post, index) => {
            doc.fontSize(14).fillColor('#7C3AED').text(`Post ${index + 1}`);
            doc.fontSize(11).fillColor('#374151');
            if (post.description) {
              doc.text(`Description: ${post.description.substring(0, 100)}${post.description.length > 100 ? '...' : ''}`);
            }
            doc.text(`Likes: ${post.likesCount?.toLocaleString() || 0} | Comments: ${post.commentsCount?.toLocaleString() || 0} | Views: ${post.viewsCount?.toLocaleString() || 0}`);
            if (post.engagementRate) {
              doc.text(`Engagement Rate: ${post.engagementRate.toFixed(2)}%`);
            }
            if (post.sentimentScore !== undefined) {
              doc.text(`Sentiment: +${post.positivePercentage?.toFixed(0)}% | ${post.neutralPercentage?.toFixed(0)}% | -${post.negativePercentage?.toFixed(0)}%`);
            }
            doc.moveDown(0.5);
          });
        }

        // Footer
        doc.fontSize(10).fillColor('#9CA3AF');
        doc.text('Generated by SocialTweebs - Social Sentiments Module', 50, doc.page.height - 50, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper methods
  private async getTeamUserIds(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [userId];

    const teamMembers = await this.userRepo.find({
      where: [
        { id: user.parentId || undefined },
        { parentId: userId },
        { parentId: user.parentId || undefined },
      ],
    });

    return [userId, ...teamMembers.map(m => m.id)];
  }

  private async checkReportAccess(userId: string, report: SentimentReport, level: 'view' | 'edit' = 'view'): Promise<void> {
    if (report.ownerId === userId || report.createdById === userId) return;

    const share = await this.shareRepo.findOne({
      where: { reportId: report.id, sharedWithUserId: userId },
    });

    if (share) {
      if (level === 'edit' && share.permissionLevel === SharePermission.VIEW) {
        throw new ForbiddenException('Edit access required');
      }
      return;
    }

    const teamUserIds = await this.getTeamUserIds(userId);
    if (teamUserIds.includes(report.createdById)) {
      if (level === 'edit') {
        throw new ForbiddenException('Cannot edit team member reports');
      }
      return;
    }

    throw new ForbiddenException('No access to this report');
  }

  private toSummaryDto(report: SentimentReport): any {
    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      reportType: report.reportType,
      influencerName: report.influencerName,
      influencerAvatarUrl: report.influencerAvatarUrl,
      overallSentimentScore: report.overallSentimentScore != null ? Number(report.overallSentimentScore) : undefined,
      status: report.status,
      creditsUsed: report.creditsUsed,
      createdAt: report.createdAt,
    };
  }

  private toDetailDto(report: SentimentReport, emotions: SentimentEmotion[], wordCloud: SentimentWordCloud[]): SentimentReportDetailDto {
    const posts = report.posts || [];

    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      reportType: report.reportType,
      targetUrl: report.targetUrl,
      influencerName: report.influencerName,
      influencerUsername: report.influencerUsername,
      influencerAvatarUrl: report.influencerAvatarUrl,
      status: report.status,
      errorMessage: report.errorMessage,
      overallSentimentScore: report.overallSentimentScore != null ? Number(report.overallSentimentScore) : undefined,
      positivePercentage: report.positivePercentage != null ? Number(report.positivePercentage) : undefined,
      neutralPercentage: report.neutralPercentage != null ? Number(report.neutralPercentage) : undefined,
      negativePercentage: report.negativePercentage != null ? Number(report.negativePercentage) : undefined,
      deepBrandAnalysis: report.deepBrandAnalysis,
      brandName: report.brandName,
      brandUsername: report.brandUsername,
      productName: report.productName,
      posts: posts.map(p => ({
        id: p.id,
        postUrl: p.postUrl,
        thumbnailUrl: p.thumbnailUrl,
        description: p.description,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        viewsCount: p.viewsCount,
        engagementRate: p.engagementRate != null ? Number(p.engagementRate) : undefined,
        sentimentScore: p.sentimentScore != null ? Number(p.sentimentScore) : undefined,
        positivePercentage: p.positivePercentage != null ? Number(p.positivePercentage) : undefined,
        neutralPercentage: p.neutralPercentage != null ? Number(p.neutralPercentage) : undefined,
        negativePercentage: p.negativePercentage != null ? Number(p.negativePercentage) : undefined,
        commentsAnalyzed: p.commentsAnalyzed,
        postDate: p.postDate ? (p.postDate instanceof Date ? p.postDate.toISOString().split('T')[0] : String(p.postDate).split('T')[0]) : undefined,
      })),
      emotions: emotions.map(e => ({
        emotion: e.emotion,
        percentage: Number(e.percentage),
        count: e.count,
      })),
      wordCloud: wordCloud.map(w => ({
        word: w.word,
        frequency: w.frequency,
        sentiment: w.sentiment,
      })),
      isPublic: report.isPublic,
      shareUrl: report.shareUrlToken ? `/sentiments/shared/${report.shareUrlToken}` : undefined,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
    };
  }
}
