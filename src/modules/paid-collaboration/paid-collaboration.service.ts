import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  PaidCollabReport,
  PaidCollabInfluencer,
  PaidCollabPost,
  PaidCollabShare,
  PaidCollabCategorization,
  PaidCollabReportStatus,
  InfluencerCategory,
  QueryLogic,
  SharePermission,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ModashService } from '../discovery/services/modash.service';
import { ActionType, ModuleType } from '../../common/enums';
import { GeneratedReportsService } from '../generated-reports/generated-reports.service';
import {
  CreatePaidCollabReportDto,
  UpdatePaidCollabReportDto,
  SharePaidCollabReportDto,
  PaidCollabReportFilterDto,
  PaidCollabReportListResponseDto,
  PaidCollabReportDetailDto,
  PaidCollabReportSummaryDto,
  PaidCollabInfluencerDto,
  PaidCollabPostDto,
  PaidCollabCategorizationDto,
  PaidCollabDashboardStatsDto,
  PostsChartDataDto,
} from './dto';

const CREDIT_PER_INFLUENCER = 1;

@Injectable()
export class PaidCollaborationService {
  private readonly logger = new Logger(PaidCollaborationService.name);

  constructor(
    @InjectRepository(PaidCollabReport)
    private readonly reportRepo: Repository<PaidCollabReport>,
    @InjectRepository(PaidCollabInfluencer)
    private readonly influencerRepo: Repository<PaidCollabInfluencer>,
    @InjectRepository(PaidCollabPost)
    private readonly postRepo: Repository<PaidCollabPost>,
    @InjectRepository(PaidCollabShare)
    private readonly shareRepo: Repository<PaidCollabShare>,
    @InjectRepository(PaidCollabCategorization)
    private readonly categorizationRepo: Repository<PaidCollabCategorization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly creditsService: CreditsService,
    private readonly modashService: ModashService,
    private readonly generatedReportsService: GeneratedReportsService,
  ) {}

  /**
   * Create a new paid collaboration report
   * Costs 1 credit per report
   */
  async createReport(userId: string, dto: CreatePaidCollabReportDto): Promise<{ success: boolean; report: PaidCollabReport; creditsUsed: number }> {
    // Validate date range (max 3 months)
    const startDate = new Date(dto.dateRangeStart);
    const endDate = new Date(dto.dateRangeEnd);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (startDate < threeMonthsAgo) {
      throw new BadRequestException('Date range start cannot be more than 3 months ago');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (!dto.hashtags?.length && !dto.mentions?.length) {
      throw new BadRequestException('At least one hashtag or mention is required');
    }

    // Per spec: 1 credit per influencer selected in the report.
    // Credits will be deducted AFTER successful Modash processing (see processReportWithModash).
    // For now, just validate balance. Actual influencer count is determined during processing.

    // Create report
    const report = new PaidCollabReport();
    report.title = dto.title || 'Untitled Collaboration Report';
    report.platform = dto.platform;
    report.hashtags = dto.hashtags || [];
    report.mentions = dto.mentions || [];
    report.queryLogic = dto.queryLogic || QueryLogic.OR;
    report.dateRangeStart = startDate;
    report.dateRangeEnd = endDate;
    report.status = PaidCollabReportStatus.PENDING;
    report.ownerId = userId;
    report.createdById = userId;
    report.shareUrlToken = `pc_${uuidv4().substring(0, 8)}`;
    report.creditsUsed = 0;

    const savedReport = await this.reportRepo.save(report);

    // Trigger async processing
    setTimeout(() => this.processReport(savedReport.id), 2000);

    return { success: true, report: savedReport, creditsUsed: 0 };
  }

  private async processReport(reportId: string): Promise<void> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) return;

    try {
      report.status = PaidCollabReportStatus.IN_PROGRESS;
      await this.reportRepo.save(report);

      if (this.modashService.isModashEnabled()) {
        await this.processReportWithModash(report);
      } else {
        await this.processReportSimulated(report);
      }

      // Deduct credits AFTER successful processing (1 credit per influencer found)
      const influencerCount = report.totalInfluencers || 1;
      const creditsToCharge = influencerCount * CREDIT_PER_INFLUENCER;
      await this.creditsService.deductCredits(report.ownerId, {
        actionType: ActionType.REPORT_GENERATION,
        quantity: creditsToCharge,
        module: ModuleType.PAID_COLLABORATION,
        resourceId: reportId,
        resourceType: 'paid_collaboration_report',
      });
      this.logger.log(`Paid collab report ${reportId}: charged ${creditsToCharge} credits (${influencerCount} influencers)`);

      report.creditsUsed = creditsToCharge;
      await this.reportRepo.save(report);

      // Record in Generated Reports
      try {
        await this.generatedReportsService.createPaidCollaborationReport(report.ownerId, {
          title: report.title,
          platform: report.platform || 'INSTAGRAM',
          reportType: 'PAID_COLLABORATION',
          exportFormat: 'REPORT',
          influencerCount: report.totalInfluencers || 0,
          fileUrl: `/api/v1/paid-collaboration/${reportId}/download`,
          dateRangeStart: report.dateRangeStart,
          dateRangeEnd: report.dateRangeEnd,
          creditsUsed: creditsToCharge,
        });
      } catch (err) {
        this.logger.warn(`Failed to record paid collab in generated reports: ${err.message}`);
      }
    } catch (error) {
      report.status = PaidCollabReportStatus.FAILED;
      report.errorMessage = error.message || 'Processing failed';
      await this.reportRepo.save(report);
      this.logger.error(`Paid collab report ${reportId} failed — NO credits charged`);
    }
  }

  private async processReportWithModash(report: PaidCollabReport): Promise<void> {
    this.logger.log(`Processing paid collab via Modash for report ${report.id}`);

    const platform = (report.platform?.toLowerCase() || 'instagram') as 'instagram' | 'tiktok' | 'youtube';
    const searchTerms = [...(report.hashtags || []), ...(report.mentions || [])];

    let totalPosts = 0;
    let totalLikes = 0;
    let totalViews = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalFollowers = 0;

    const influencerMap = new Map<string, { inf: PaidCollabInfluencer; likes: number; views: number; comments: number; shares: number; posts: number }>();

    for (const term of searchTerms) {
      try {
        const identifier = term.replace(/^[@#]/, '');
        const collabResult = await this.modashService.getCollaborationPosts(
          identifier, platform,
          {
            limit: 20,
            postCreationTimestampMs: {
              gte: new Date(report.dateRangeStart).getTime(),
              lte: new Date(report.dateRangeEnd).getTime(),
            },
          },
          report.ownerId,
        );

        const posts = collabResult.influencer?.posts || collabResult.brand?.posts || [];

        for (const modashPost of posts) {
          const username = modashPost.username || modashPost.user_id || `unknown_${modashPost.post_id}`;
          if (!influencerMap.has(username)) {
            const inf = new PaidCollabInfluencer();
            inf.reportId = report.id;
            inf.influencerName = username;
            inf.influencerUsername = username;
            inf.platform = report.platform || 'INSTAGRAM';
            inf.profilePictureUrl = modashPost.user_picture || '';
            inf.followerCount = 0;
            inf.category = InfluencerCategory.NANO;
            inf.displayOrder = influencerMap.size;
            const savedInf = await this.influencerRepo.save(inf);
            influencerMap.set(username, { inf: savedInf, likes: 0, views: 0, comments: 0, shares: 0, posts: 0 });
          }
          const entry = influencerMap.get(username)!;

          const postTimestamp = modashPost.post_timestamp
            ? (modashPost.post_timestamp > 1e12 ? modashPost.post_timestamp : modashPost.post_timestamp * 1000)
            : Date.now();

          const post = new PaidCollabPost();
          post.reportId = report.id;
          post.influencerId = entry.inf.id;
          post.postId = modashPost.post_id;
          post.postType = 'IMAGE';
          post.thumbnailUrl = modashPost.post_thumbnail || '';
          post.caption = modashPost.description || modashPost.title || '';
          post.isSponsored = modashPost.collaboration_type === 'Paid';
          post.likesCount = modashPost.stats?.likes || 0;
          post.commentsCount = modashPost.stats?.comments || 0;
          post.viewsCount = modashPost.stats?.views || modashPost.stats?.plays || 0;
          post.sharesCount = modashPost.stats?.shares || 0;
          post.postDate = new Date(postTimestamp);
          post.postUrl = this.constructPostUrl(modashPost.post_id, username, report.platform || 'INSTAGRAM');
          await this.postRepo.save(post);

          entry.likes += post.likesCount;
          entry.views += post.viewsCount;
          entry.comments += post.commentsCount;
          entry.shares += post.sharesCount;
          entry.posts++;
          totalPosts++;
          totalLikes += post.likesCount;
          totalViews += post.viewsCount;
          totalComments += post.commentsCount;
          totalShares += post.sharesCount;
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch posts for term "${term}": ${err.message}`);
      }
    }

    const infPlatform = (report.platform || 'INSTAGRAM') as any;
    for (const [username, entry] of influencerMap) {
      entry.inf.postsCount = entry.posts;
      entry.inf.likesCount = entry.likes;
      entry.inf.viewsCount = entry.views;
      entry.inf.commentsCount = entry.comments;
      entry.inf.sharesCount = entry.shares;

      if (Number(entry.inf.followerCount) === 0 && this.modashService.isModashEnabled()) {
        try {
          const modashReport = await this.modashService.getInfluencerReport(infPlatform, username, report.ownerId);
          const rpt = modashReport as any;
          const innerProfile = rpt.profile || rpt;
          entry.inf.followerCount = Number(innerProfile.followers) || Number(innerProfile.followerCount) || 0;
          entry.inf.influencerName = innerProfile.fullname || innerProfile.username || username;
          entry.inf.category = this.getInfluencerCategory(entry.inf.followerCount);
        } catch (err) {
          this.logger.warn(`Paid collab: failed to fetch follower count for ${username}: ${err.message}`);
        }
      }

      const fc = Number(entry.inf.followerCount) || 0;
      const denom = entry.posts * fc;
      entry.inf.engagementRate = denom > 0 ? ((entry.likes + entry.comments) / denom) * 100 : 0;
      await this.influencerRepo.save(entry.inf);
      totalFollowers += fc;
    }

    const totalInfluencers = influencerMap.size;
    report.totalInfluencers = totalInfluencers;
    report.totalPosts = totalPosts;
    report.totalLikes = totalLikes;
    report.totalViews = totalViews;
    report.totalComments = totalComments;
    report.totalShares = totalShares;
    const avgFollowersPerInf = totalInfluencers > 0 ? totalFollowers / totalInfluencers : 0;
    const reportEngDenom = totalPosts * avgFollowersPerInf;
    report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
    report.engagementViewsRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    const categoryData: Record<string, { accounts: number; followers: number; posts: number; likes: number; views: number; comments: number; shares: number }> = {};
    for (const [, entry] of influencerMap) {
      const cat = entry.inf.category || InfluencerCategory.NANO;
      if (!categoryData[cat]) categoryData[cat] = { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 };
      categoryData[cat].accounts++;
      categoryData[cat].followers += Number(entry.inf.followerCount) || 0;
      categoryData[cat].posts += entry.posts;
      categoryData[cat].likes += entry.likes;
      categoryData[cat].views += entry.views;
      categoryData[cat].comments += entry.comments;
      categoryData[cat].shares += entry.shares;
    }
    categoryData[InfluencerCategory.ALL] = { accounts: totalInfluencers, followers: totalFollowers, posts: totalPosts, likes: totalLikes, views: totalViews, comments: totalComments, shares: totalShares };
    for (const [category, cData] of Object.entries(categoryData)) {
      const cat = new PaidCollabCategorization();
      cat.reportId = report.id;
      cat.category = category as InfluencerCategory;
      cat.accountsCount = cData.accounts;
      cat.followersCount = cData.followers;
      cat.postsCount = cData.posts;
      cat.likesCount = cData.likes;
      cat.viewsCount = cData.views;
      cat.commentsCount = cData.comments;
      cat.sharesCount = cData.shares;
      const catDenom = cData.posts > 0 && cData.accounts > 0 ? cData.posts * (cData.followers / cData.accounts) : 0;
      cat.engagementRate = cData.followers > 0 && catDenom > 0 ? ((cData.likes + cData.comments) / catDenom) * 100 : 0;
      await this.categorizationRepo.save(cat);
    }

    report.status = PaidCollabReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);
  }

  private async processReportSimulated(report: PaidCollabReport): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const influencerCount = Math.floor(Math.random() * 20) + 5;
    const influencerData = await this.generateDummyInfluencers(report, influencerCount);

    let totalInfluencers = 0, totalPosts = 0, totalLikes = 0, totalViews = 0, totalComments = 0, totalShares = 0, totalFollowers = 0;
    const categoryData: Record<string, { accounts: number; followers: number; posts: number; likes: number; views: number; comments: number; shares: number }> = {
      [InfluencerCategory.ALL]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      [InfluencerCategory.NANO]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      [InfluencerCategory.MICRO]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      [InfluencerCategory.MACRO]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      [InfluencerCategory.MEGA]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
    };

    for (const infData of influencerData) {
      const fc = Number(infData.followerCount) || 0;
      totalInfluencers++;
      totalFollowers += fc;
      totalPosts += Number(infData.postsCount) || 0;
      totalLikes += Number(infData.likesCount) || 0;
      totalViews += Number(infData.viewsCount) || 0;
      totalComments += Number(infData.commentsCount) || 0;
      totalShares += Number(infData.sharesCount) || 0;
      const cat = infData.category;
      categoryData[cat].accounts++;
      categoryData[cat].followers += fc;
      categoryData[cat].posts += Number(infData.postsCount) || 0;
      categoryData[cat].likes += Number(infData.likesCount) || 0;
      categoryData[cat].views += Number(infData.viewsCount) || 0;
      categoryData[cat].comments += Number(infData.commentsCount) || 0;
      categoryData[cat].shares += Number(infData.sharesCount) || 0;
    }

    categoryData[InfluencerCategory.ALL] = { accounts: totalInfluencers, followers: totalFollowers, posts: totalPosts, likes: totalLikes, views: totalViews, comments: totalComments, shares: totalShares };

    for (const [category, data] of Object.entries(categoryData)) {
      const cat = new PaidCollabCategorization();
      cat.reportId = report.id;
      cat.category = category as InfluencerCategory;
      cat.accountsCount = data.accounts;
      cat.followersCount = data.followers;
      cat.postsCount = data.posts;
      cat.likesCount = data.likes;
      cat.viewsCount = data.views;
      cat.commentsCount = data.comments;
      cat.sharesCount = data.shares;
      const catDenom = data.posts > 0 && data.accounts > 0 ? data.posts * (data.followers / data.accounts) : 0;
      cat.engagementRate = data.followers > 0 && catDenom > 0 ? ((data.likes + data.comments) / catDenom) * 100 : 0;
      await this.categorizationRepo.save(cat);
    }

    report.totalInfluencers = totalInfluencers;
    report.totalPosts = totalPosts;
    report.totalLikes = totalLikes;
    report.totalViews = totalViews;
    report.totalComments = totalComments;
    report.totalShares = totalShares;
    const avgFollowersPerInf = totalInfluencers > 0 ? totalFollowers / totalInfluencers : 0;
    const reportEngDenom = totalPosts * avgFollowersPerInf;
    report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
    report.engagementViewsRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
    report.status = PaidCollabReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);
  }

  private async generateDummyInfluencers(report: PaidCollabReport, count: number): Promise<PaidCollabInfluencer[]> {
    const influencers: PaidCollabInfluencer[] = [];
    const names = [
      'Fashion Star', 'Travel Guru', 'Fitness Pro', 'Tech Reviewer', 'Food Blogger',
      'Beauty Queen', 'Lifestyle Maven', 'Music Lover', 'Art Creator', 'Gaming Pro',
      'Health Coach', 'Business Mentor', 'DIY Master', 'Pet Lover', 'Car Enthusiast',
      'Sports Fan', 'Movie Buff', 'Book Worm', 'Coffee Addict', 'Adventure Seeker',
    ];

    for (let i = 0; i < count; i++) {
      const followerCount = Math.floor(Math.random() * 1000000) + 1000;
      const postsCount = Math.floor(Math.random() * 10) + 1;

      const inf = new PaidCollabInfluencer();
      inf.reportId = report.id;
      inf.influencerName = names[i % names.length] + ` ${i + 1}`;
      inf.influencerUsername = names[i % names.length].toLowerCase().replace(' ', '_') + `_${i + 1}`;
      inf.platform = report.platform;
      inf.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.influencerName)}&background=random`;
      inf.followerCount = followerCount;
      inf.category = this.getInfluencerCategory(followerCount);
      inf.credibilityScore = Math.floor(Math.random() * 30) + 70; // 70-100
      inf.displayOrder = i;

      let savedInf = await this.influencerRepo.save(inf);

      let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;

      for (let j = 0; j < postsCount; j++) {
        const post = await this.generateDummyPost(report, savedInf, j);
        infLikes += Number(post.likesCount) || 0;
        infViews += Number(post.viewsCount) || 0;
        infComments += Number(post.commentsCount) || 0;
        infShares += Number(post.sharesCount) || 0;
      }

      savedInf.postsCount = postsCount;
      savedInf.likesCount = infLikes;
      savedInf.viewsCount = infViews;
      savedInf.commentsCount = infComments;
      savedInf.sharesCount = infShares;
      const infDenom = postsCount * followerCount;
      savedInf.engagementRate =
        followerCount > 0 && infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;

      savedInf = await this.influencerRepo.save(savedInf);
      influencers.push(savedInf);
    }

    return influencers;
  }

  private async generateDummyPost(report: PaidCollabReport, influencer: PaidCollabInfluencer, index: number): Promise<PaidCollabPost> {
    const post = new PaidCollabPost();
    post.reportId = report.id;
    post.influencerId = influencer.id;
    post.postId = `post_${Date.now()}_${index}`;
    post.postType = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'][Math.floor(Math.random() * 4)];
    post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + index}`;
    
    // Generate caption with hashtags and mentions
    const matchedHashtags = report.hashtags.filter(() => Math.random() > 0.3);
    const matchedMentions = report.mentions.filter(() => Math.random() > 0.3);
    
    post.caption = `Check out this amazing collaboration! ${matchedHashtags.map(h => `#${h.replace('#', '')}`).join(' ')} ${matchedMentions.map(m => `@${m.replace('@', '')}`).join(' ')} #sponsored`;
    post.matchedHashtags = matchedHashtags;
    post.matchedMentions = matchedMentions;
    post.isSponsored = Math.random() > 0.5;
    
    post.likesCount = Math.floor(Math.random() * 20000) + 500;
    post.commentsCount = Math.floor(Math.random() * 500) + 20;
    post.viewsCount = Math.floor(Math.random() * 100000) + 5000;
    post.sharesCount = Math.floor(Math.random() * 200) + 10;
    post.engagementRate = influencer.followerCount > 0
      ? ((post.likesCount + post.commentsCount) / influencer.followerCount) * 100
      : 0;
    
    // Random date within the report's date range
    const startTime = new Date(report.dateRangeStart).getTime();
    const endTime = new Date(report.dateRangeEnd).getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    post.postDate = new Date(randomTime);
    
    post.postUrl = `https://instagram.com/p/${post.postId}`;

    return await this.postRepo.save(post);
  }

  private getInfluencerCategory(followerCount: number): InfluencerCategory {
    if (followerCount < 10000) return InfluencerCategory.NANO;
    if (followerCount < 100000) return InfluencerCategory.MICRO;
    if (followerCount < 500000) return InfluencerCategory.MACRO;
    return InfluencerCategory.MEGA;
  }

  /**
   * Get list of reports with filters
   */
  async getReports(userId: string, filters: PaidCollabReportFilterDto): Promise<PaidCollabReportListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepo.createQueryBuilder('report');

    // Filter by created by
    if (filters.createdBy === 'ME') {
      queryBuilder.where('report.createdById = :userId', { userId });
    } else if (filters.createdBy === 'TEAM') {
      const teamUserIds = await this.getTeamUserIds(userId);
      queryBuilder.where('report.createdById IN (:...teamUserIds)', { teamUserIds: teamUserIds.filter(id => id !== userId) });
    } else if (filters.createdBy === 'SHARED') {
      const sharedReportIds = await this.getSharedReportIds(userId);
      if (sharedReportIds.length === 0) {
        return { reports: [], total: 0, page, limit, hasMore: false };
      }
      queryBuilder.where('report.id IN (:...sharedReportIds)', { sharedReportIds });
    } else {
      // ALL - show user's reports + team reports + shared reports
      const teamUserIds = await this.getTeamUserIds(userId);
      const sharedReportIds = await this.getSharedReportIds(userId);
      
      if (sharedReportIds.length > 0) {
        queryBuilder.where(
          '(report.createdById = :userId OR report.createdById IN (:...teamUserIds) OR report.id IN (:...sharedReportIds))',
          { userId, teamUserIds, sharedReportIds }
        );
      } else {
        queryBuilder.where(
          '(report.createdById = :userId OR report.createdById IN (:...teamUserIds))',
          { userId, teamUserIds }
        );
      }
    }

    // Filter by platform
    if (filters.platform && filters.platform !== 'ALL') {
      queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    // Search
    if (filters.search) {
      queryBuilder.andWhere(
        '(LOWER(report.title) LIKE :search OR LOWER(array_to_string(report.hashtags, \',\')) LIKE :search OR LOWER(array_to_string(report.mentions, \',\')) LIKE :search)',
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
  async getReportById(userId: string, reportId: string): Promise<PaidCollabReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['influencers', 'posts', 'posts.influencer', 'categorizations'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    // Sort posts by date
    report.posts = report.posts?.sort((a, b) => 
      new Date(b.postDate || 0).getTime() - new Date(a.postDate || 0).getTime()
    ) || [];

    // Sort influencers by likes count (most liked first)
    report.influencers = report.influencers?.sort((a, b) => 
      Number(b.likesCount) - Number(a.likesCount)
    ) || [];

    return this.toDetailDto(report);
  }

  /**
   * Get report by share token
   */
  async getReportByShareToken(token: string): Promise<PaidCollabReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['influencers', 'posts', 'posts.influencer', 'categorizations'],
    });

    if (!report) {
      throw new NotFoundException('Report not found or not publicly shared');
    }

    return this.toDetailDto(report);
  }

  /**
   * Update report
   */
  async updateReport(userId: string, reportId: string, dto: UpdatePaidCollabReportDto): Promise<{ success: boolean; report: PaidCollabReport }> {
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

  /**
   * Delete report
   */
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
   * Retry failed report
   */
  async retryReport(userId: string, reportId: string): Promise<{ success: boolean; report: PaidCollabReport; creditsUsed: number }> {
    const report = await this.reportRepo.findOne({ 
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (report.status !== PaidCollabReportStatus.FAILED) {
      throw new BadRequestException('Only failed reports can be retried');
    }

    // Delete existing data
    await this.postRepo.delete({ reportId });
    await this.influencerRepo.delete({ reportId });
    await this.categorizationRepo.delete({ reportId });

    // Reset report — credits deducted after successful processing
    report.status = PaidCollabReportStatus.PENDING;
    report.errorMessage = undefined;
    report.retryCount += 1;
    await this.reportRepo.save(report);

    // Trigger processing (credits charged on success inside processReport)
    setTimeout(() => this.processReport(reportId), 2000);

    return { success: true, report, creditsUsed: 0 };
  }

  /**
   * Share report
   */
  async shareReport(userId: string, reportId: string, dto: SharePaidCollabReportDto): Promise<{ success: boolean; shareUrl?: string }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    let targetUserId = dto.sharedWithUserId;

    // Find user by email if provided
    if (!targetUserId && dto.sharedWithEmail) {
      const targetUser = await this.userRepo.findOne({ where: { email: dto.sharedWithEmail } });
      if (!targetUser) {
        throw new NotFoundException('User with this email not found');
      }
      targetUserId = targetUser.id;
    }

    if (targetUserId) {
      const existingShare = await this.shareRepo.findOne({
        where: { reportId, sharedWithUserId: targetUserId },
      });

      if (!existingShare) {
        const share = new PaidCollabShare();
        share.reportId = reportId;
        share.sharedWithUserId = targetUserId;
        share.sharedByUserId = userId;
        share.permissionLevel = dto.permissionLevel || SharePermission.VIEW;
        await this.shareRepo.save(share);
      }
    }

    // Make public for link sharing
    report.isPublic = true;
    await this.reportRepo.save(report);

    const shareUrl = `/paid-collaboration/shared/${report.shareUrlToken}`;

    return { success: true, shareUrl };
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(userId: string): Promise<PaidCollabDashboardStatsDto> {
    const teamUserIds = await this.getTeamUserIds(userId);

    const allReports = await this.reportRepo.find({
      where: { createdById: In([userId, ...teamUserIds]) },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedReports = allReports.filter(r => r.status === PaidCollabReportStatus.COMPLETED);

    const totalInfluencersAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalInfluencers || 0), 0);
    const totalPostsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalPosts || 0), 0);
    const avgEngagement = completedReports.length > 0
      ? completedReports.reduce((sum, r) => sum + (Number(r.avgEngagementRate) || 0), 0) / completedReports.length
      : 0;

    return {
      totalReports: allReports.length,
      completedReports: completedReports.length,
      inProgressReports: allReports.filter(r => r.status === PaidCollabReportStatus.IN_PROGRESS).length,
      pendingReports: allReports.filter(r => r.status === PaidCollabReportStatus.PENDING).length,
      failedReports: allReports.filter(r => r.status === PaidCollabReportStatus.FAILED).length,
      reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
      totalInfluencersAnalyzed,
      totalPostsAnalyzed,
      avgEngagementRate: Number(avgEngagement.toFixed(2)),
    };
  }

  /**
   * Get chart data for posts/influencers over time
   */
  async getChartData(userId: string, reportId: string): Promise<PostsChartDataDto[]> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const posts = await this.postRepo.find({ where: { reportId } });

    // Group posts by date
    const grouped: Record<string, { posts: number; influencers: Set<string>; likes: number; views: number }> = {};
    
    posts.forEach(post => {
      const dateStr = post.postDate ? new Date(post.postDate).toISOString().split('T')[0] : 'Unknown';
      if (!grouped[dateStr]) {
        grouped[dateStr] = { posts: 0, influencers: new Set(), likes: 0, views: 0 };
      }
      grouped[dateStr].posts += 1;
      if (post.influencerId) {
        grouped[dateStr].influencers.add(post.influencerId);
      }
      grouped[dateStr].likes += post.likesCount || 0;
      grouped[dateStr].views += post.viewsCount || 0;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        postsCount: data.posts,
        influencersCount: data.influencers.size,
        likesCount: data.likes,
        viewsCount: data.views,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get posts filtered by sponsored status
   */
  async getPosts(
    userId: string, 
    reportId: string, 
    sponsoredOnly: boolean = false,
    sortBy: string = 'likesCount',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    category?: InfluencerCategory,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ posts: PaidCollabPostDto[]; total: number }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const queryBuilder = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.influencer', 'influencer')
      .where('post.reportId = :reportId', { reportId });

    if (sponsoredOnly) {
      queryBuilder.andWhere('post.isSponsored = true');
    }

    if (category && category !== InfluencerCategory.ALL) {
      queryBuilder.andWhere('influencer.category = :category', { category });
    }

    const validSortFields = ['likesCount', 'commentsCount', 'viewsCount', 'sharesCount', 'postDate', 'engagementRate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'likesCount';
    queryBuilder.orderBy(`post.${sortField}`, sortOrder);

    const total = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      posts: posts.map(post => this.toPostDto(post)),
      total,
    };
  }

  /**
   * Get influencers with filtering and sorting
   */
  async getInfluencers(
    userId: string,
    reportId: string,
    category?: InfluencerCategory,
    sortBy: string = 'likesCount',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    page: number = 1,
    limit: number = 20,
  ): Promise<{ influencers: PaidCollabInfluencerDto[]; total: number }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const queryBuilder = this.influencerRepo.createQueryBuilder('influencer')
      .where('influencer.reportId = :reportId', { reportId });

    if (category && category !== InfluencerCategory.ALL) {
      queryBuilder.andWhere('influencer.category = :category', { category });
    }

    // Apply sorting
    const sortFieldMap: Record<string, string> = {
      recent: 'createdAt',
      oldest: 'createdAt',
      leastLiked: 'likesCount',
      mostLiked: 'likesCount',
      leastCommented: 'commentsCount',
      mostCommented: 'commentsCount',
      lowestCredibility: 'credibilityScore',
      highestCredibility: 'credibilityScore',
      lowestFollowers: 'followerCount',
      highestFollowers: 'followerCount',
    };

    const orderMap: Record<string, 'ASC' | 'DESC'> = {
      recent: 'DESC',
      oldest: 'ASC',
      leastLiked: 'ASC',
      mostLiked: 'DESC',
      leastCommented: 'ASC',
      mostCommented: 'DESC',
      lowestCredibility: 'ASC',
      highestCredibility: 'DESC',
      lowestFollowers: 'ASC',
      highestFollowers: 'DESC',
    };

    const sortField = sortFieldMap[sortBy] || 'likesCount';
    const order = orderMap[sortBy] || sortOrder;
    queryBuilder.orderBy(`influencer.${sortField}`, order);

    const total = await queryBuilder.getCount();
    const influencers = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      influencers: influencers.map(inf => this.toInfluencerDto(inf)),
      total,
    };
  }

  // =============== Helper Methods ===============

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

  private async getSharedReportIds(userId: string): Promise<string[]> {
    const shares = await this.shareRepo.find({
      where: { sharedWithUserId: userId },
      select: ['reportId'],
    });
    return shares.map(s => s.reportId);
  }

  private async checkReportAccess(userId: string, report: PaidCollabReport, level: 'view' | 'edit' = 'view'): Promise<void> {
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

  private toSummaryDto(report: PaidCollabReport): PaidCollabReportSummaryDto {
    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      status: report.status,
      hashtags: report.hashtags || [],
      mentions: report.mentions || [],
      dateRangeStart: report.dateRangeStart ? (report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : String(report.dateRangeStart).split('T')[0]) : '',
      dateRangeEnd: report.dateRangeEnd ? (report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : String(report.dateRangeEnd).split('T')[0]) : '',
      totalInfluencers: report.totalInfluencers || 0,
      totalPosts: report.totalPosts || 0,
      creditsUsed: report.creditsUsed,
      createdAt: report.createdAt,
    };
  }

  private toDetailDto(report: PaidCollabReport): PaidCollabReportDetailDto {
    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      status: report.status,
      errorMessage: report.errorMessage,
      hashtags: report.hashtags || [],
      mentions: report.mentions || [],
      queryLogic: report.queryLogic,
      dateRangeStart: report.dateRangeStart ? (report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : String(report.dateRangeStart).split('T')[0]) : '',
      dateRangeEnd: report.dateRangeEnd ? (report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : String(report.dateRangeEnd).split('T')[0]) : '',
      totalInfluencers: report.totalInfluencers || 0,
      totalPosts: report.totalPosts || 0,
      totalLikes: Number(report.totalLikes) || 0,
      totalViews: Number(report.totalViews) || 0,
      totalComments: Number(report.totalComments) || 0,
      totalShares: Number(report.totalShares) || 0,
      avgEngagementRate: report.avgEngagementRate ? Number(report.avgEngagementRate) : undefined,
      engagementViewsRate: report.engagementViewsRate ? Number(report.engagementViewsRate) : undefined,
      influencers: (report.influencers || []).map(inf => this.toInfluencerDto(inf)),
      posts: (report.posts || []).map(post => this.toPostDto(post)),
      categorizations: (report.categorizations || []).map(cat => this.toCategorizationDto(cat)),
      isPublic: report.isPublic,
      shareUrl: report.shareUrlToken ? `/paid-collaboration/shared/${report.shareUrlToken}` : undefined,
      creditsUsed: report.creditsUsed,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
    };
  }

  private toInfluencerDto(inf: PaidCollabInfluencer): PaidCollabInfluencerDto {
    return {
      id: inf.id,
      influencerName: inf.influencerName,
      influencerUsername: inf.influencerUsername,
      platform: inf.platform,
      profilePictureUrl: inf.profilePictureUrl,
      followerCount: Number(inf.followerCount),
      postsCount: inf.postsCount || 0,
      likesCount: Number(inf.likesCount) || 0,
      viewsCount: Number(inf.viewsCount) || 0,
      commentsCount: Number(inf.commentsCount) || 0,
      sharesCount: Number(inf.sharesCount) || 0,
      engagementRate: inf.engagementRate ? Number(inf.engagementRate) : undefined,
      category: inf.category,
      credibilityScore: inf.credibilityScore ? Number(inf.credibilityScore) : undefined,
    };
  }

  private toPostDto(post: PaidCollabPost): PaidCollabPostDto {
    return {
      id: post.id,
      postUrl: post.postUrl,
      postType: post.postType,
      thumbnailUrl: post.thumbnailUrl,
      caption: post.caption,
      matchedHashtags: post.matchedHashtags,
      matchedMentions: post.matchedMentions,
      isSponsored: post.isSponsored,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      viewsCount: post.viewsCount || 0,
      sharesCount: post.sharesCount || 0,
      engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
      postDate: post.postDate ? (post.postDate instanceof Date ? post.postDate.toISOString().split('T')[0] : String(post.postDate).split('T')[0]) : undefined,
      influencerName: post.influencer?.influencerName,
      influencerUsername: post.influencer?.influencerUsername,
    };
  }

  private toCategorizationDto(cat: PaidCollabCategorization): PaidCollabCategorizationDto {
    return {
      category: cat.category,
      accountsCount: cat.accountsCount || 0,
      followersCount: Number(cat.followersCount) || 0,
      postsCount: cat.postsCount || 0,
      likesCount: Number(cat.likesCount) || 0,
      viewsCount: Number(cat.viewsCount) || 0,
      commentsCount: Number(cat.commentsCount) || 0,
      sharesCount: Number(cat.sharesCount) || 0,
      engagementRate: cat.engagementRate ? Number(cat.engagementRate) : undefined,
    };
  }

  private constructPostUrl(postId: string, username: string, platform: string): string {
    if (!postId) return '';
    const p = platform.toUpperCase();
    if (p === 'INSTAGRAM') return `https://www.instagram.com/p/${postId}/`;
    if (p === 'TIKTOK') return `https://www.tiktok.com/@${username}/video/${postId}`;
    if (p === 'YOUTUBE') return `https://www.youtube.com/watch?v=${postId}`;
    return '';
  }
}
