import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import {
  CustomErReport,
  CustomErPost,
  CustomErShare,
  CustomErReportStatus,
  SharePermission,
} from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import {
  CreateCustomErReportDto,
  UpdateCustomErReportDto,
  ShareCustomErReportDto,
  CustomErReportFilterDto,
  CustomErReportListResponseDto,
  CustomErReportDetailDto,
  DashboardStatsDto,
  PostSummaryDto,
  EngagementMetricsDto,
} from './dto';
import { ModashService } from '../discovery/services/modash.service';
import { ModashRawService } from '../discovery/services/modash-raw.service';

@Injectable()
export class CustomErService {
  private readonly logger = new Logger(CustomErService.name);

  constructor(
    @InjectRepository(CustomErReport)
    private readonly reportRepo: Repository<CustomErReport>,
    @InjectRepository(CustomErPost)
    private readonly postRepo: Repository<CustomErPost>,
    @InjectRepository(CustomErShare)
    private readonly shareRepo: Repository<CustomErShare>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InfluencerProfile)
    private readonly profileRepo: Repository<InfluencerProfile>,
    private readonly modashService: ModashService,
    private readonly modashRawService: ModashRawService,
  ) {}

  /**
   * Create a new custom ER report
   * NOTE: This is FREE - no credits deducted
   */
  async createReport(userId: string, dto: CreateCustomErReportDto): Promise<{ success: boolean; report: CustomErReport }> {
    // Validate date range (max 1 year)
    const startDate = new Date(dto.dateRangeStart);
    const endDate = new Date(dto.dateRangeEnd);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (startDate < oneYearAgo) {
      throw new BadRequestException('Date range cannot be more than 1 year old');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Create report
    const report = new CustomErReport();
    report.influencerProfileId = dto.influencerProfileId;
    report.platform = dto.platform;
    report.dateRangeStart = startDate;
    report.dateRangeEnd = endDate;
    report.status = CustomErReportStatus.PENDING;
    report.ownerId = userId;
    report.createdById = userId;
    report.shareUrlToken = `er_share_${uuidv4().substring(0, 8)}`;

    const cachedProfile = await this.profileRepo.findOne({
      where: { id: dto.influencerProfileId },
    });
    if (cachedProfile) {
      report.influencerName = cachedProfile.fullName || cachedProfile.username || 'Unknown';
      report.influencerUsername = cachedProfile.username || '';
      report.followerCount = Number(cachedProfile.followerCount) || 0;
    } else {
      report.influencerName = 'Unknown Influencer';
      report.influencerUsername = '';
      report.followerCount = 0;
    }

    const savedReport = await this.reportRepo.save(report);

    // Trigger processing (in real app, this would be a background job)
    setTimeout(() => this.processReport(savedReport.id), 2000);

    return { success: true, report: savedReport };
  }

  /**
   * Process report (simulate fetching posts and calculating metrics)
   */
  private async processReport(reportId: string): Promise<void> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) return;

    try {
      report.status = CustomErReportStatus.PROCESSING;
      await this.reportRepo.save(report);

      if (this.modashRawService.isRawApiEnabled()) {
        await this.processReportWithRawApi(report);
      } else {
        await this.processReportSimulated(report);
      }
    } catch (error) {
      report.status = CustomErReportStatus.FAILED;
      report.errorMessage = error.message || 'Processing failed';
      await this.reportRepo.save(report);
    }
  }

  private async processReportWithRawApi(report: CustomErReport): Promise<void> {
    this.logger.log(`Processing custom ER via Modash Raw API for report ${report.id}`);

    const fcForMetrics = Number(report.followerCount) || 0;
    const rangeStart = new Date(report.dateRangeStart).getTime();
    const rangeEnd = new Date(report.dateRangeEnd).getTime();
    const plat = (report.platform || 'instagram').toUpperCase();

    let cachedProfile = await this.profileRepo.findOne({
      where: { id: report.influencerProfileId },
    });

    // PRD #13: If no cached profile or profile is stale (>7 days), try Discovery API fallback
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (cachedProfile && cachedProfile.modashFetchedAt && cachedProfile.modashFetchedAt < sevenDaysAgo) {
      try {
        if (this.modashService.isModashEnabled()) {
          const platformMap: Record<string, any> = {
            INSTAGRAM: 'INSTAGRAM', TIKTOK: 'TIKTOK', YOUTUBE: 'YOUTUBE',
          };
          const reportPlatform = platformMap[(report.platform || 'INSTAGRAM').toUpperCase()] || 'INSTAGRAM';
          const freshReport = await this.modashService.getInfluencerReport(
            reportPlatform,
            cachedProfile.platformUserId,
          );
          if (freshReport?.stats) {
            cachedProfile.followerCount = freshReport.stats.followers || cachedProfile.followerCount;
            cachedProfile.modashFetchedAt = new Date();
            await this.profileRepo.save(cachedProfile);
            report.followerCount = Number(cachedProfile.followerCount) || 0;
          }
        }
      } catch (err) {
        this.logger.warn(`Discovery fallback for Custom ER failed (non-critical): ${err.message}`);
      }
    }

    const rawUserId = cachedProfile?.platformUserId || report.influencerUsername || '';

    const rawPosts: Array<{ id: string; description: string; likes: number; comments: number; views: number; shares: number; timestamp: number; thumbnail?: string; isSponsored: boolean }> = [];

    try {
      if (plat === 'INSTAGRAM') {
        const feed = await this.modashRawService.getIgUserFeed(rawUserId);
        for (const p of (feed.data || [])) {
          const ts = (p.taken_at || 0) * 1000;
          if (ts >= rangeStart && ts <= rangeEnd) {
            const caption = p.caption?.text || '';
            rawPosts.push({
              id: p.id || p.code,
              description: caption,
              likes: p.like_count || 0,
              comments: p.comment_count || 0,
              views: p.play_count || 0,
              shares: 0,
              timestamp: ts,
              thumbnail: p.image_versions2?.candidates?.[0]?.url,
              isSponsored: /\b(ad|sponsored|partner|collab)\b/i.test(caption),
            });
          }
        }
      } else if (plat === 'TIKTOK') {
        const feed = await this.modashRawService.getTiktokUserFeed(rawUserId);
        for (const p of (feed.data || [])) {
          const ts = (p.createTime || 0) * 1000;
          if (ts >= rangeStart && ts <= rangeEnd) {
            rawPosts.push({
              id: p.id,
              description: p.desc || '',
              likes: p.stats?.diggCount || 0,
              comments: p.stats?.commentCount || 0,
              views: p.stats?.playCount || 0,
              shares: p.stats?.shareCount || 0,
              timestamp: ts,
              thumbnail: p.video?.cover,
              isSponsored: /\b(ad|sponsored|partner|collab)\b/i.test(p.desc || ''),
            });
          }
        }
      } else if (plat === 'YOUTUBE') {
        const feed = await this.modashRawService.getYoutubeUploadedVideos(rawUserId);
        for (const p of (feed.data || [])) {
          const ts = new Date(p.publishedAt).getTime();
          if (ts >= rangeStart && ts <= rangeEnd) {
            rawPosts.push({
              id: p.videoId,
              description: p.title || '',
              likes: p.likeCount || 0,
              comments: p.commentCount || 0,
              views: p.viewCount || 0,
              shares: 0,
              timestamp: ts,
              thumbnail: p.thumbnail,
              isSponsored: /\b(ad|sponsored|partner|collab)\b/i.test(p.title || ''),
            });
          }
        }
      }
    } catch (err) {
      this.logger.error(`Raw API error for custom ER report ${report.id}: ${err.message}`);
      report.status = CustomErReportStatus.FAILED;
      report.errorMessage = `Failed to fetch data from platform: ${err.message}`;
      await this.reportRepo.save(report);
      return;
    }

    if (rawPosts.length === 0) {
      this.logger.warn(
        `No posts found in date range for ${rawUserId}; completing with zero metrics`,
      );
      report.allPostsCount = 0;
      report.status = CustomErReportStatus.COMPLETED;
      report.completedAt = new Date();
      report.errorMessage = undefined;
      await this.reportRepo.save(report);
      return;
    }

    const posts: CustomErPost[] = [];
    let totalLikes = 0, totalViews = 0, totalComments = 0, totalShares = 0;
    let sponsoredLikes = 0, sponsoredViews = 0, sponsoredComments = 0, sponsoredShares = 0;
    let sponsoredCount = 0;

    for (const rp of rawPosts) {
      const post = new CustomErPost();
      post.reportId = report.id;
      post.postId = rp.id;
      post.postUrl = '';
      post.postType = 'IMAGE' as any;
      post.thumbnailUrl = rp.thumbnail || '';
      post.description = rp.description;
      post.likesCount = rp.likes;
      post.viewsCount = rp.views;
      post.commentsCount = rp.comments;
      post.sharesCount = rp.shares;
      post.engagementRate = fcForMetrics > 0
        ? Math.min(((rp.likes + rp.comments) / fcForMetrics) * 100, 99999999.9999)
        : 0;
      post.isSponsored = rp.isSponsored;
      post.postDate = new Date(rp.timestamp);
      posts.push(post);

      totalLikes += rp.likes;
      totalViews += rp.views;
      totalComments += rp.comments;
      totalShares += rp.shares;

      if (rp.isSponsored) {
        sponsoredCount++;
        sponsoredLikes += rp.likes;
        sponsoredViews += rp.views;
        sponsoredComments += rp.comments;
        sponsoredShares += rp.shares;
      }
    }

    await this.postRepo.save(posts);
    this.updateReportMetrics(report, posts.length, fcForMetrics, totalLikes, totalViews, totalComments, totalShares, sponsoredCount, sponsoredLikes, sponsoredViews, sponsoredComments, sponsoredShares);
    report.status = CustomErReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);
  }

  private async processReportSimulated(report: CustomErReport): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const followerCountNum = Number(report.followerCount) || 0;
    if (followerCountNum === 0) {
      report.followerCount = Math.floor(Math.random() * 90000) + 10000;
      await this.reportRepo.save(report);
    }

    const fcForMetrics = Number(report.followerCount) || 0;
    const numPosts = Math.floor(Math.random() * 20) + 10;
    const posts: CustomErPost[] = [];
    let totalLikes = 0, totalViews = 0, totalComments = 0, totalShares = 0;
    let sponsoredLikes = 0, sponsoredViews = 0, sponsoredComments = 0, sponsoredShares = 0;
    let sponsoredCount = 0;

    for (let i = 0; i < numPosts; i++) {
      const isSponsored = Math.random() < 0.2;
      const likes = Math.floor(Math.random() * 5000) + 500;
      const views = Math.floor(Math.random() * 30000) + 5000;
      const comments = Math.floor(Math.random() * 300) + 20;
      const shares = Math.floor(Math.random() * 100) + 10;

      const post = new CustomErPost();
      post.reportId = report.id;
      post.postId = `post_${Date.now()}_${i}`;
      post.postUrl = `https://instagram.com/p/${post.postId}`;
      post.postType = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'][Math.floor(Math.random() * 4)] as any;
      post.thumbnailUrl = `https://picsum.photos/400/400?random=${i}`;
      post.description = isSponsored
        ? `AD: Check out this amazing product! #sponsored #ad`
        : `Beautiful day! #lifestyle #photography`;
      post.hashtags = isSponsored ? ['#sponsored', '#ad', '#partnership'] : ['#lifestyle', '#photography'];
      post.mentions = isSponsored ? ['@brand_partner'] : [];
      post.likesCount = likes;
      post.viewsCount = views;
      post.commentsCount = comments;
      post.sharesCount = shares;
      post.engagementRate = fcForMetrics > 0
        ? Math.min(((likes + comments) / fcForMetrics) * 100, 99999999.9999)
        : 0;
      post.isSponsored = isSponsored;
      const rangeStart = new Date(report.dateRangeStart).getTime();
      const rangeEnd = new Date(report.dateRangeEnd).getTime();
      post.postDate = new Date(rangeStart + Math.random() * (rangeEnd - rangeStart));
      posts.push(post);

      totalLikes += likes;
      totalViews += views;
      totalComments += comments;
      totalShares += shares;
      if (isSponsored) { sponsoredCount++; sponsoredLikes += likes; sponsoredViews += views; sponsoredComments += comments; sponsoredShares += shares; }
    }

    await this.postRepo.save(posts);
    this.updateReportMetrics(report, numPosts, fcForMetrics, totalLikes, totalViews, totalComments, totalShares, sponsoredCount, sponsoredLikes, sponsoredViews, sponsoredComments, sponsoredShares);
    report.status = CustomErReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);
  }

  private updateReportMetrics(
    report: CustomErReport, numPosts: number, fc: number,
    totalLikes: number, totalViews: number, totalComments: number, totalShares: number,
    sponsoredCount: number, sponsoredLikes: number, sponsoredViews: number, sponsoredComments: number, sponsoredShares: number,
  ): void {
    report.allPostsCount = numPosts;
    report.allLikesCount = totalLikes;
    report.allViewsCount = totalViews;
    report.allCommentsCount = totalComments;
    report.allSharesCount = totalShares;
    report.allAvgEngagementRate = fc > 0 && numPosts > 0
      ? Math.min(((totalLikes + totalComments) / fc / numPosts) * 100, 99999999.9999) : 0;
    report.allEngagementViewsRate = totalViews > 0
      ? Math.min(((totalLikes + totalComments) / totalViews) * 100, 99999999.9999) : 0;

    if (sponsoredCount > 0) {
      report.hasSponsoredPosts = true;
      report.sponsoredPostsCount = sponsoredCount;
      report.sponsoredLikesCount = sponsoredLikes;
      report.sponsoredViewsCount = sponsoredViews;
      report.sponsoredCommentsCount = sponsoredComments;
      report.sponsoredSharesCount = sponsoredShares;
      report.sponsoredAvgEngagementRate = fc > 0 && sponsoredCount > 0
        ? Math.min(((sponsoredLikes + sponsoredComments) / fc / sponsoredCount) * 100, 99999999.9999) : 0;
      report.sponsoredEngagementViewsRate = sponsoredViews > 0
        ? Math.min(((sponsoredLikes + sponsoredComments) / sponsoredViews) * 100, 99999999.9999) : 0;
    }
  }

  /**
   * Get list of reports with filters
   */
  async getReports(userId: string, filters: CustomErReportFilterDto): Promise<CustomErReportListResponseDto> {
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

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    // Search by influencer name
    if (filters.search) {
      queryBuilder.andWhere(
        '(LOWER(report.influencerName) LIKE :search OR LOWER(report.influencerUsername) LIKE :search)',
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
  async getReportById(userId: string, reportId: string): Promise<CustomErReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    return this.toDetailDto(report);
  }

  /**
   * Get report by share token (public access)
   */
  async getReportByShareToken(token: string): Promise<CustomErReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found or not publicly shared');
    }

    return this.toDetailDto(report);
  }

  /**
   * Update report
   */
  async updateReport(userId: string, reportId: string, dto: UpdateCustomErReportDto): Promise<{ success: boolean; report: CustomErReport }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (dto.isPublic !== undefined) report.isPublic = dto.isPublic;
    if (dto.influencerName !== undefined) report.influencerName = dto.influencerName.trim();

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
   * Share report
   */
  async shareReport(userId: string, reportId: string, dto: ShareCustomErReportDto): Promise<{ success: boolean; shareUrl?: string }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (dto.sharedWithUserId) {
      const share = new CustomErShare();
      share.reportId = reportId;
      share.sharedWithUserId = dto.sharedWithUserId;
      share.sharedByUserId = userId;
      share.permissionLevel = dto.permissionLevel || SharePermission.VIEW;
      await this.shareRepo.save(share);
    }

    report.isPublic = true;
    await this.reportRepo.save(report);

    const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/custom-er/shared/${report.shareUrlToken}`;

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

    return {
      totalReports: allReports.length,
      completedReports: allReports.filter(r => r.status === CustomErReportStatus.COMPLETED).length,
      processingReports: allReports.filter(r => r.status === CustomErReportStatus.PROCESSING).length,
      pendingReports: allReports.filter(r => r.status === CustomErReportStatus.PENDING).length,
      failedReports: allReports.filter(r => r.status === CustomErReportStatus.FAILED).length,
      reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
    };
  }

  /**
   * Get posts for a report with optional filter
   */
  async getReportPosts(userId: string, reportId: string, sponsoredOnly: boolean = false): Promise<PostSummaryDto[]> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const queryBuilder = this.postRepo.createQueryBuilder('post')
      .where('post.reportId = :reportId', { reportId });

    if (sponsoredOnly) {
      queryBuilder.andWhere('post.isSponsored = true');
    }

    queryBuilder.orderBy('post.postDate', 'DESC');

    const posts = await queryBuilder.getMany();

    return posts.map(p => this.toPostDto(p));
  }

  /**
   * Create reports from uploaded Excel file
   */
  async createReportsFromExcel(
    userId: string,
    file: Express.Multer.File,
    platform: string,
    dateRangeStart: string,
    dateRangeEnd: string,
  ): Promise<{ success: boolean; reportsCreated: number; errors: string[] }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!platform || !dateRangeStart || !dateRangeEnd) {
      throw new BadRequestException('Platform and date range are required');
    }

    const startDate = new Date(dateRangeStart);
    const endDate = new Date(dateRangeEnd);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (startDate < oneYearAgo) {
      throw new BadRequestException('Date range cannot be more than 1 year old');
    }
    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      throw new BadRequestException('Excel file has no data rows');
    }

    const errors: string[] = [];
    let reportsCreated = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const profileUrl = row['Profile URL'] || row['profile_url'] || row['profileUrl'] || row['url'] || '';
      const influencerName = row['Influencer Name'] || row['influencer_name'] || row['name'] || '';
      const followers = parseInt(row['Followers'] || row['followers'] || row['follower_count'] || '0', 10) || 0;

      if (!profileUrl && !influencerName) {
        errors.push(`Row ${i + 2}: Missing profile URL and influencer name`);
        continue;
      }

      try {
        let username = '';
        if (profileUrl) {
          const urlMatch = profileUrl.match(/(?:instagram\.com|tiktok\.com)\/@?([^/?]+)/i);
          username = urlMatch ? urlMatch[1] : profileUrl;
        }

        const report = new CustomErReport();
        report.influencerProfileUrl = profileUrl;
        report.influencerName = influencerName || username || `Influencer ${i + 1}`;
        report.influencerUsername = username || influencerName;
        report.platform = platform;
        report.dateRangeStart = startDate;
        report.dateRangeEnd = endDate;
        report.status = CustomErReportStatus.PENDING;
        report.ownerId = userId;
        report.createdById = userId;
        report.followerCount = followers;
        report.shareUrlToken = `er_share_${uuidv4().substring(0, 8)}`;

        const savedReport = await this.reportRepo.save(report);
        reportsCreated++;

        setTimeout(() => this.processReport(savedReport.id), 2000 + i * 1000);
      } catch (err) {
        errors.push(`Row ${i + 2}: Failed to create report - ${err.message}`);
      }
    }

    return { success: reportsCreated > 0, reportsCreated, errors };
  }

  /**
   * Generate sample Excel file for bulk upload reference
   */
  generateSampleExcel(): Buffer {
    const sampleData = [
      { 'Influencer Name': 'John Doe', 'Profile URL': 'https://instagram.com/johndoe', 'Followers': 50000 },
      { 'Influencer Name': 'Jane Smith', 'Profile URL': 'https://instagram.com/janesmith', 'Followers': 120000 },
      { 'Influencer Name': 'Creator Pro', 'Profile URL': 'https://instagram.com/creatorpro', 'Followers': 75000 },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    worksheet['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Influencers');
    return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
  }

  /**
   * Download report as XLSX file
   */
  async downloadReportAsXlsx(userId: string, reportId: string): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      { Metric: 'Influencer Name', Value: report.influencerName },
      { Metric: 'Username', Value: report.influencerUsername || '' },
      { Metric: 'Platform', Value: report.platform },
      { Metric: 'Followers', Value: report.followerCount },
      { Metric: 'Date Range', Value: `${report.dateRangeStart} to ${report.dateRangeEnd}` },
      { Metric: 'Report Status', Value: report.status },
      { Metric: '', Value: '' },
      { Metric: '--- All Posts ---', Value: '' },
      { Metric: 'Total Posts', Value: report.allPostsCount },
      { Metric: 'Total Likes', Value: Number(report.allLikesCount) },
      { Metric: 'Total Views', Value: Number(report.allViewsCount) },
      { Metric: 'Total Comments', Value: Number(report.allCommentsCount) },
      { Metric: 'Total Shares', Value: Number(report.allSharesCount) },
      { Metric: 'Avg Engagement Rate (%)', Value: report.allAvgEngagementRate ? Number(report.allAvgEngagementRate).toFixed(2) : '0' },
      { Metric: 'Engagements/Views Rate (%)', Value: report.allEngagementViewsRate ? Number(report.allEngagementViewsRate).toFixed(2) : '0' },
    ];

    if (report.hasSponsoredPosts) {
      summaryData.push(
        { Metric: '', Value: '' },
        { Metric: '--- Sponsored Posts ---', Value: '' },
        { Metric: 'Sponsored Posts', Value: report.sponsoredPostsCount },
        { Metric: 'Sponsored Likes', Value: Number(report.sponsoredLikesCount) },
        { Metric: 'Sponsored Views', Value: Number(report.sponsoredViewsCount) },
        { Metric: 'Sponsored Comments', Value: Number(report.sponsoredCommentsCount) },
        { Metric: 'Sponsored Shares', Value: Number(report.sponsoredSharesCount) },
        { Metric: 'Sponsored Avg ER (%)', Value: report.sponsoredAvgEngagementRate ? Number(report.sponsoredAvgEngagementRate).toFixed(2) : '0' },
        { Metric: 'Sponsored Eng/Views (%)', Value: report.sponsoredEngagementViewsRate ? Number(report.sponsoredEngagementViewsRate).toFixed(2) : '0' },
      );
    }

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Posts sheet
    const posts = report.posts || [];
    const postsData = posts.map(p => ({
      'Post Date': p.postDate instanceof Date ? p.postDate.toISOString().split('T')[0] : String(p.postDate).split('T')[0],
      'Post Type': p.postType || '',
      'Description': p.description || '',
      'Likes': p.likesCount,
      'Views': p.viewsCount,
      'Comments': p.commentsCount,
      'Shares': p.sharesCount,
      'Engagement Rate (%)': p.engagementRate ? Number(p.engagementRate).toFixed(2) : '0',
      'Sponsored': p.isSponsored ? 'Yes' : 'No',
      'Post URL': p.postUrl || '',
      'Hashtags': (p.hashtags || []).join(', '),
      'Mentions': (p.mentions || []).join(', '),
    }));

    if (postsData.length > 0) {
      const postsSheet = XLSX.utils.json_to_sheet(postsData);
      postsSheet['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 40 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
        { wch: 10 }, { wch: 45 }, { wch: 30 }, { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(workbook, postsSheet, 'Posts');
    }

    const buffer = Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
    const filename = `ER_Report_${report.influencerUsername || report.influencerName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { buffer, filename };
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

  private async checkReportAccess(userId: string, report: CustomErReport, level: 'view' | 'edit' = 'view'): Promise<void> {
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

  private toSummaryDto(report: CustomErReport): any {
    return {
      id: report.id,
      influencerName: report.influencerName,
      influencerUsername: report.influencerUsername,
      influencerAvatarUrl: report.influencerAvatarUrl,
      platform: report.platform,
      dateRangeStart: report.dateRangeStart instanceof Date 
        ? report.dateRangeStart.toISOString().split('T')[0]
        : String(report.dateRangeStart).split('T')[0],
      dateRangeEnd: report.dateRangeEnd instanceof Date
        ? report.dateRangeEnd.toISOString().split('T')[0]
        : String(report.dateRangeEnd).split('T')[0],
      postsCount: report.allPostsCount,
      status: report.status,
      createdAt: report.createdAt,
    };
  }

  private toDetailDto(report: CustomErReport): CustomErReportDetailDto {
    const posts = report.posts || [];
    
    // Generate chart data (posts per day)
    const postsChartData = this.generateChartData(posts, report.dateRangeStart, report.dateRangeEnd);

    return {
      id: report.id,
      influencerName: report.influencerName,
      influencerUsername: report.influencerUsername,
      influencerAvatarUrl: report.influencerAvatarUrl,
      followerCount: report.followerCount,
      platform: report.platform,
      dateRangeStart: report.dateRangeStart instanceof Date
        ? report.dateRangeStart.toISOString().split('T')[0]
        : String(report.dateRangeStart).split('T')[0],
      dateRangeEnd: report.dateRangeEnd instanceof Date
        ? report.dateRangeEnd.toISOString().split('T')[0]
        : String(report.dateRangeEnd).split('T')[0],
      status: report.status,
      errorMessage: report.errorMessage,
      allPostsMetrics: {
        postsCount: report.allPostsCount,
        likesCount: Number(report.allLikesCount),
        viewsCount: Number(report.allViewsCount),
        commentsCount: Number(report.allCommentsCount),
        sharesCount: Number(report.allSharesCount),
        avgEngagementRate: report.allAvgEngagementRate ? Number(report.allAvgEngagementRate) : undefined,
        engagementViewsRate: report.allEngagementViewsRate ? Number(report.allEngagementViewsRate) : undefined,
      },
      sponsoredPostsMetrics: report.hasSponsoredPosts ? {
        postsCount: report.sponsoredPostsCount,
        likesCount: Number(report.sponsoredLikesCount),
        viewsCount: Number(report.sponsoredViewsCount),
        commentsCount: Number(report.sponsoredCommentsCount),
        sharesCount: Number(report.sponsoredSharesCount),
        avgEngagementRate: report.sponsoredAvgEngagementRate ? Number(report.sponsoredAvgEngagementRate) : undefined,
        engagementViewsRate: report.sponsoredEngagementViewsRate ? Number(report.sponsoredEngagementViewsRate) : undefined,
      } : undefined,
      hasSponsoredPosts: report.hasSponsoredPosts,
      posts: posts.map(p => this.toPostDto(p)),
      postsChartData,
      isPublic: report.isPublic,
      shareUrl: report.shareUrlToken ? `/custom-er/shared/${report.shareUrlToken}` : undefined,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
    };
  }

  private toPostDto(post: CustomErPost): PostSummaryDto {
    return {
      id: post.id,
      postId: post.postId,
      postUrl: post.postUrl,
      postType: post.postType,
      thumbnailUrl: post.thumbnailUrl,
      description: post.description,
      hashtags: post.hashtags,
      mentions: post.mentions,
      likesCount: post.likesCount,
      viewsCount: post.viewsCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
      isSponsored: post.isSponsored,
      postDate: post.postDate instanceof Date
        ? post.postDate.toISOString().split('T')[0]
        : String(post.postDate).split('T')[0],
    };
  }

  private generateChartData(posts: CustomErPost[], startDate: Date, endDate: Date): any[] {
    const chartData: { [key: string]: { regularPosts: number; sponsoredPosts: number } } = {};

    // Initialize all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      chartData[dateStr] = { regularPosts: 0, sponsoredPosts: 0 };
    }

    // Count posts per day
    for (const post of posts) {
      const dateStr = post.postDate instanceof Date
        ? post.postDate.toISOString().split('T')[0]
        : String(post.postDate).split('T')[0];
      
      if (chartData[dateStr]) {
        if (post.isSponsored) {
          chartData[dateStr].sponsoredPosts++;
        } else {
          chartData[dateStr].regularPosts++;
        }
      }
    }

    return Object.entries(chartData).map(([date, data]) => ({
      date,
      regularPosts: data.regularPosts,
      sponsoredPosts: data.sponsoredPosts,
    }));
  }
}
