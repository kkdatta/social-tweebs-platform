import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  CollabCheckReport,
  CollabCheckInfluencer,
  CollabCheckPost,
  CollabCheckShare,
  CollabReportStatus,
  TimePeriod,
  SharePermission,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ActionType, ModuleType } from '../../common/enums';
import {
  CreateCollabCheckReportDto,
  UpdateCollabCheckReportDto,
  ShareCollabCheckReportDto,
  CollabCheckReportFilterDto,
  CollabCheckReportListResponseDto,
  CollabCheckReportDetailDto,
  CollabCheckInfluencerDto,
  CollabCheckPostDto,
  DashboardStatsDto,
  PostsChartDataDto,
} from './dto';
import { ModashService } from '../discovery/services/modash.service';

const CREDIT_PER_INFLUENCER = 1;
/** Flat credit cost for retry (does not scale with influencer count) */
const RETRY_CREDIT_FLAT = 1;

@Injectable()
export class CollabCheckService {
  private readonly logger = new Logger(CollabCheckService.name);

  constructor(
    @InjectRepository(CollabCheckReport)
    private readonly reportRepo: Repository<CollabCheckReport>,
    @InjectRepository(CollabCheckInfluencer)
    private readonly influencerRepo: Repository<CollabCheckInfluencer>,
    @InjectRepository(CollabCheckPost)
    private readonly postRepo: Repository<CollabCheckPost>,
    @InjectRepository(CollabCheckShare)
    private readonly shareRepo: Repository<CollabCheckShare>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly creditsService: CreditsService,
    private readonly modashService: ModashService,
  ) {}

  /**
   * Create a new collab check report.
   * Costs 1 credit per influencer — charged AFTER successful Modash processing.
   */
  async createReport(userId: string, dto: CreateCollabCheckReportDto): Promise<{ success: boolean; report: CollabCheckReport; creditsUsed: number }> {
    const influencerCount = dto.influencers.length;
    const totalCredits = influencerCount * CREDIT_PER_INFLUENCER;

    // Validate balance upfront but do NOT deduct yet (universal refresh guard)
    const balance = await this.creditsService.getBalance(userId);
    if ((balance.unifiedBalance || 0) < totalCredits) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${totalCredits}, Available: ${balance.unifiedBalance}`,
      );
    }

    const report = new CollabCheckReport();
    report.title = dto.title || 'Untitled Collab Report';
    report.platform = dto.platform;
    report.timePeriod = dto.timePeriod;
    report.queries = dto.queries;
    report.status = CollabReportStatus.PENDING;
    report.ownerId = userId;
    report.createdById = userId;
    report.shareUrlToken = `collab_${uuidv4().substring(0, 8)}`;
    report.creditsUsed = totalCredits;

    const savedReport = await this.reportRepo.save(report);

    for (let i = 0; i < dto.influencers.length; i++) {
      const inf = new CollabCheckInfluencer();
      inf.reportId = savedReport.id;
      inf.influencerName = dto.influencers[i];
      inf.influencerUsername = dto.influencers[i].replace('@', '');
      inf.platform = dto.platform;
      inf.displayOrder = i;
      inf.followerCount = Math.floor(Math.random() * 500000) + 10000;
      await this.influencerRepo.save(inf);
    }

    // Process async — credits deducted only on success
    setTimeout(() => this.processReport(savedReport.id), 2000);

    return { success: true, report: savedReport, creditsUsed: totalCredits };
  }

  private async processReport(reportId: string): Promise<void> {
    const report = await this.reportRepo.findOne({ 
      where: { id: reportId },
      relations: ['influencers'],
    });
    if (!report) return;

    try {
      report.status = CollabReportStatus.PROCESSING;
      await this.reportRepo.save(report);

      if (this.modashService.isModashEnabled()) {
        await this.processReportWithModash(report);
      } else {
        await this.processReportSimulated(report);
      }

      // Deduct credits ONLY after successful processing (universal refresh guard)
      const totalCredits = (report.influencers?.length || 1) * CREDIT_PER_INFLUENCER;
      await this.creditsService.deductCredits(report.ownerId, {
        actionType: ActionType.REPORT_GENERATION,
        quantity: totalCredits,
        module: ModuleType.INFLUENCER_COLLAB_CHECK,
        resourceId: reportId,
        resourceType: 'collab_report_creation',
      });
      this.logger.log(`Collab check ${reportId}: charged ${totalCredits} credits after success`);
    } catch (error) {
      report.status = CollabReportStatus.FAILED;
      report.errorMessage = error.message || 'Processing failed';
      await this.reportRepo.save(report);
      this.logger.error(`Collab check ${reportId} failed — NO credits charged`);
    }
  }

  private async processRetryReport(reportId: string, userId: string, creditsToCharge: number): Promise<void> {
    try {
      await this.processReport(reportId);

      const report = await this.reportRepo.findOne({ where: { id: reportId } });
      if (report?.status === CollabReportStatus.COMPLETED) {
        await this.creditsService.deductCredits(userId, {
          actionType: ActionType.REPORT_REFRESH,
          quantity: creditsToCharge,
          module: ModuleType.INFLUENCER_COLLAB_CHECK,
          resourceId: reportId,
          resourceType: 'collab_report_retry',
        });
        report.creditsUsed += creditsToCharge;
        await this.reportRepo.save(report);
        this.logger.log(`Collab retry ${reportId}: charged ${creditsToCharge} credits after success`);
      } else {
        this.logger.log(`Collab retry ${reportId}: NOT charging — report did not complete successfully`);
      }
    } catch (error) {
      this.logger.error(`Collab retry ${reportId} failed — NO credits charged: ${error.message}`);
    }
  }

  private async processReportWithModash(report: CollabCheckReport): Promise<void> {
    this.logger.log(`Processing collab check via Modash for report ${report.id}`);

    let totalPosts = 0;
    let totalLikes = 0;
    let totalViews = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalFollowers = 0;

    for (const influencer of report.influencers) {
      const handle = influencer.influencerUsername || influencer.influencerName;
      const platform = (report.platform?.toLowerCase() || 'instagram') as 'instagram' | 'tiktok' | 'youtube';

      const collabResult = await this.modashService.getCollaborationPosts(
        handle,
        platform,
        { limit: 30 },
        report.ownerId,
      );

      const posts = collabResult.influencer?.posts || collabResult.brand?.posts || [];
      let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;

      for (const modashPost of posts) {
        const post = new CollabCheckPost();
        post.reportId = report.id;
        post.influencerId = influencer.id;
        post.postId = modashPost.post_id;
        post.postType = 'IMAGE';
        post.thumbnailUrl = modashPost.post_thumbnail || '';
        post.description = modashPost.description || modashPost.title || '';
        post.matchedKeywords = report.queries.filter(
          (q) => (modashPost.description || '').toLowerCase().includes(q.toLowerCase()),
        );
        post.likesCount = modashPost.stats?.likes || 0;
        post.commentsCount = modashPost.stats?.comments || 0;
        post.viewsCount = modashPost.stats?.views || modashPost.stats?.plays || 0;
        post.sharesCount = modashPost.stats?.shares || 0;
        const fc = Number(influencer.followerCount) || 0;
        post.engagementRate = fc > 0 ? ((post.likesCount + post.commentsCount) / fc) * 100 : 0;
        const postTs = modashPost.post_timestamp
          ? (modashPost.post_timestamp > 1e12 ? modashPost.post_timestamp : modashPost.post_timestamp * 1000)
          : Date.now();
        post.postDate = new Date(postTs);
        post.postUrl = '';
        await this.postRepo.save(post);

        infLikes += post.likesCount;
        infViews += post.viewsCount;
        infComments += post.commentsCount;
        infShares += post.sharesCount;
      }

      influencer.postsCount = posts.length;
      influencer.likesCount = infLikes;
      influencer.viewsCount = infViews;
      influencer.commentsCount = infComments;
      influencer.sharesCount = infShares;
      const infFc = Number(influencer.followerCount) || 0;
      const infDenom = posts.length * infFc;
      influencer.avgEngagementRate = infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;
      await this.influencerRepo.save(influencer);

      totalPosts += posts.length;
      totalLikes += infLikes;
      totalViews += infViews;
      totalComments += infComments;
      totalShares += infShares;
      totalFollowers += Number(influencer.followerCount) || 0;
    }

    report.totalPosts = totalPosts;
    report.totalLikes = totalLikes;
    report.totalViews = totalViews;
    report.totalComments = totalComments;
    report.totalShares = totalShares;
    report.totalFollowers = totalFollowers;
    const infLen = report.influencers.length;
    const avgFollowersPerInf = infLen > 0 ? totalFollowers / infLen : 0;
    const reportEngDenom = totalPosts * avgFollowersPerInf;
    report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
    report.status = CollabReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);
  }

  private async processReportSimulated(report: CollabCheckReport): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    let totalPosts = 0;
    let totalLikes = 0;
    let totalViews = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalFollowers = 0;

    const { startDate } = this.getDateRange(report.timePeriod);

    for (const influencer of report.influencers) {
      const postsCount = Math.floor(Math.random() * 15) + 5;
      let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;

      for (let i = 0; i < postsCount; i++) {
        const post = new CollabCheckPost();
        post.reportId = report.id;
        post.influencerId = influencer.id;
        post.postId = `post_${Date.now()}_${i}`;
        post.postType = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'][Math.floor(Math.random() * 4)];
        post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + i}`;
        const matchedQueries = report.queries.filter(() => Math.random() > 0.3);
        post.description = `Check out this amazing collab! ${matchedQueries.join(' ')} #sponsored #collaboration`;
        post.matchedKeywords = matchedQueries;
        post.likesCount = Math.floor(Math.random() * 10000) + 500;
        post.commentsCount = Math.floor(Math.random() * 500) + 20;
        post.viewsCount = Math.floor(Math.random() * 50000) + 2000;
        post.sharesCount = Math.floor(Math.random() * 200) + 10;
        const fc = Number(influencer.followerCount) || 0;
        post.engagementRate = fc > 0 ? ((post.likesCount + post.commentsCount) / fc) * 100 : 0;
        const randomDays = Math.floor(Math.random() * this.getDaysFromPeriod(report.timePeriod));
        const postDate = new Date(startDate);
        postDate.setDate(postDate.getDate() + randomDays);
        post.postDate = postDate;
        post.postUrl = `https://instagram.com/p/${post.postId}`;
        await this.postRepo.save(post);

        infLikes += Number(post.likesCount) || 0;
        infViews += Number(post.viewsCount) || 0;
        infComments += Number(post.commentsCount) || 0;
        infShares += Number(post.sharesCount) || 0;
      }

      influencer.postsCount = postsCount;
      influencer.likesCount = infLikes;
      influencer.viewsCount = infViews;
      influencer.commentsCount = infComments;
      influencer.sharesCount = infShares;
      const infFc = Number(influencer.followerCount) || 0;
      const infDenom = postsCount * infFc;
      influencer.avgEngagementRate = infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;
      await this.influencerRepo.save(influencer);

      totalPosts += postsCount;
      totalLikes += infLikes;
      totalViews += infViews;
      totalComments += infComments;
      totalShares += infShares;
      totalFollowers += Number(influencer.followerCount) || 0;
    }

    report.totalPosts = totalPosts;
    report.totalLikes = totalLikes;
    report.totalViews = totalViews;
    report.totalComments = totalComments;
    report.totalShares = totalShares;
    report.totalFollowers = totalFollowers;
    const infLen = report.influencers.length;
    const avgFollowersPerInf = infLen > 0 ? totalFollowers / infLen : 0;
    const reportEngDenom = totalPosts * avgFollowersPerInf;
    report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
    report.status = CollabReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);
  }

  private getDateRange(timePeriod: TimePeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timePeriod) {
      case TimePeriod.ONE_MONTH:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case TimePeriod.THREE_MONTHS:
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case TimePeriod.SIX_MONTHS:
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case TimePeriod.ONE_YEAR:
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  }

  private getDaysFromPeriod(timePeriod: TimePeriod): number {
    switch (timePeriod) {
      case TimePeriod.ONE_MONTH: return 30;
      case TimePeriod.THREE_MONTHS: return 90;
      case TimePeriod.SIX_MONTHS: return 180;
      case TimePeriod.ONE_YEAR: return 365;
      default: return 30;
    }
  }

  /**
   * Get list of reports with filters
   */
  async getReports(userId: string, filters: CollabCheckReportFilterDto): Promise<CollabCheckReportListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepo.createQueryBuilder('report')
      .leftJoinAndSelect('report.influencers', 'influencers');

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

    // Search
    if (filters.search) {
      queryBuilder.andWhere(
        '(LOWER(report.title) LIKE :search OR LOWER(array_to_string(report.queries, \',\')) LIKE :search)',
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
  async getReportById(userId: string, reportId: string): Promise<CollabCheckReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['influencers', 'posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    // Sort posts by date
    report.posts = report.posts?.sort((a, b) => 
      new Date(b.postDate || 0).getTime() - new Date(a.postDate || 0).getTime()
    ) || [];

    return this.toDetailDto(report);
  }

  /**
   * Get report by share token
   */
  async getReportByShareToken(token: string): Promise<CollabCheckReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['influencers', 'posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found or not publicly shared');
    }

    return this.toDetailDto(report);
  }

  /**
   * Update report
   */
  async updateReport(userId: string, reportId: string, dto: UpdateCollabCheckReportDto): Promise<{ success: boolean; report: CollabCheckReport }> {
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
  async retryReport(userId: string, reportId: string): Promise<{ success: boolean; report: CollabCheckReport; creditsUsed: number }> {
    const report = await this.reportRepo.findOne({ 
      where: { id: reportId },
      relations: ['influencers'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (report.status !== CollabReportStatus.FAILED && report.status !== CollabReportStatus.COMPLETED) {
      throw new BadRequestException('Only completed or failed reports can be retried');
    }

    const totalCredits = RETRY_CREDIT_FLAT;

    // Validate balance upfront but defer deduction until after success (universal refresh guard)
    const balance = await this.creditsService.getBalance(userId);
    if ((balance.unifiedBalance || 0) < totalCredits) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${totalCredits}, Available: ${balance.unifiedBalance}`,
      );
    }

    // Delete existing posts
    await this.postRepo.delete({ reportId });

    // Reset report
    report.status = CollabReportStatus.PENDING;
    report.errorMessage = undefined;
    report.retryCount += 1;
    await this.reportRepo.save(report);

    // Trigger processing -- credits deducted only on success inside processReport
    setTimeout(() => this.processRetryReport(reportId, userId, totalCredits), 2000);

    return { success: true, report, creditsUsed: totalCredits };
  }

  /**
   * Share report
   */
  async shareReport(userId: string, reportId: string, dto: ShareCollabCheckReportDto): Promise<{ success: boolean; shareUrl?: string }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (dto.sharedWithUserId) {
      const existingShare = await this.shareRepo.findOne({
        where: { reportId, sharedWithUserId: dto.sharedWithUserId },
      });

      if (!existingShare) {
        const share = new CollabCheckShare();
        share.reportId = reportId;
        share.sharedWithUserId = dto.sharedWithUserId;
        share.sharedByUserId = userId;
        share.permissionLevel = dto.permissionLevel || SharePermission.VIEW;
        await this.shareRepo.save(share);
      }
    }

    // Make public for link sharing
    report.isPublic = true;
    await this.reportRepo.save(report);

    const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/collab-check/shared/${report.shareUrlToken}`;

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
    const completedReports = allReports.filter(r => r.status === CollabReportStatus.COMPLETED);

    const totalPostsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalPosts || 0), 0);
    const avgEngagement = completedReports.length > 0
      ? completedReports.reduce((sum, r) => sum + (Number(r.avgEngagementRate) || 0), 0) / completedReports.length
      : 0;

    return {
      totalReports: allReports.length,
      completedReports: completedReports.length,
      processingReports: allReports.filter(r => r.status === CollabReportStatus.PROCESSING).length,
      pendingReports: allReports.filter(r => r.status === CollabReportStatus.PENDING).length,
      failedReports: allReports.filter(r => r.status === CollabReportStatus.FAILED).length,
      reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
      totalPostsAnalyzed,
      avgEngagementRate: Number(avgEngagement.toFixed(2)),
    };
  }

  /**
   * Get chart data for posts over time
   */
  async getChartData(userId: string, reportId: string): Promise<PostsChartDataDto[]> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const posts = await this.postRepo.find({ where: { reportId } });

    const grouped: Record<string, { posts: number; likes: number; views: number; comments: number }> = {};
    
    posts.forEach(post => {
      const dateStr = post.postDate ? new Date(post.postDate).toISOString().split('T')[0] : 'Unknown';
      if (!grouped[dateStr]) {
        grouped[dateStr] = { posts: 0, likes: 0, views: 0, comments: 0 };
      }
      grouped[dateStr].posts += 1;
      grouped[dateStr].likes += Number(post.likesCount) || 0;
      grouped[dateStr].views += Number(post.viewsCount) || 0;
      grouped[dateStr].comments += Number(post.commentsCount) || 0;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        postsCount: data.posts,
        likesCount: data.likes,
        viewsCount: data.views,
        commentsCount: data.comments,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Search influencers for report creation
   */
  async searchInfluencers(platform: string, query: string, limit: number = 10): Promise<any[]> {
    // In real implementation, this would call Modash API or query local DB
    // For now, return dummy results
    const dummyInfluencers = [
      { id: '1', username: 'fashion_star', fullName: 'Fashion Star', followers: 150000, profilePicture: 'https://ui-avatars.com/api/?name=FS' },
      { id: '2', username: 'travel_guru', fullName: 'Travel Guru', followers: 250000, profilePicture: 'https://ui-avatars.com/api/?name=TG' },
      { id: '3', username: 'fitness_pro', fullName: 'Fitness Pro', followers: 180000, profilePicture: 'https://ui-avatars.com/api/?name=FP' },
      { id: '4', username: 'tech_reviewer', fullName: 'Tech Reviewer', followers: 320000, profilePicture: 'https://ui-avatars.com/api/?name=TR' },
      { id: '5', username: 'food_blogger', fullName: 'Food Blogger', followers: 95000, profilePicture: 'https://ui-avatars.com/api/?name=FB' },
    ];

    return dummyInfluencers
      .filter(inf => 
        !query || 
        inf.username.toLowerCase().includes(query.toLowerCase()) ||
        inf.fullName.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
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

  private async checkReportAccess(userId: string, report: CollabCheckReport, level: 'view' | 'edit' = 'view'): Promise<void> {
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

  private toSummaryDto(report: CollabCheckReport): any {
    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      status: report.status,
      timePeriod: report.timePeriod,
      queries: report.queries || [],
      totalPosts: report.totalPosts || 0,
      totalFollowers: Number(report.totalFollowers) || 0,
      creditsUsed: report.creditsUsed,
      createdAt: report.createdAt,
      influencers: (report.influencers || []).map(inf => ({
        id: inf.id,
        influencerName: inf.influencerName,
        influencerUsername: inf.influencerUsername,
        platform: inf.platform,
        profilePictureUrl: inf.profilePictureUrl,
        followerCount: inf.followerCount,
        postsCount: inf.postsCount || 0,
      })),
    };
  }

  private toDetailDto(report: CollabCheckReport): CollabCheckReportDetailDto {
    const influencerMap = new Map();
    (report.influencers || []).forEach(inf => {
      influencerMap.set(inf.id, inf);
    });

    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      status: report.status,
      errorMessage: report.errorMessage,
      timePeriod: report.timePeriod,
      queries: report.queries || [],
      totalPosts: report.totalPosts || 0,
      totalLikes: Number(report.totalLikes) || 0,
      totalViews: Number(report.totalViews) || 0,
      totalComments: Number(report.totalComments) || 0,
      totalShares: Number(report.totalShares) || 0,
      avgEngagementRate: report.avgEngagementRate ? Number(report.avgEngagementRate) : undefined,
      totalFollowers: Number(report.totalFollowers) || 0,
      influencers: (report.influencers || []).map(inf => ({
        id: inf.id,
        influencerName: inf.influencerName,
        influencerUsername: inf.influencerUsername,
        platform: inf.platform,
        profilePictureUrl: inf.profilePictureUrl,
        followerCount: inf.followerCount,
        postsCount: inf.postsCount || 0,
        likesCount: Number(inf.likesCount) || 0,
        viewsCount: Number(inf.viewsCount) || 0,
        commentsCount: Number(inf.commentsCount) || 0,
        sharesCount: Number(inf.sharesCount) || 0,
        avgEngagementRate: inf.avgEngagementRate ? Number(inf.avgEngagementRate) : undefined,
      })),
      posts: (report.posts || []).map(post => {
        const influencer = post.influencerId ? influencerMap.get(post.influencerId) : null;
        return {
          id: post.id,
          postUrl: post.postUrl,
          postType: post.postType,
          thumbnailUrl: post.thumbnailUrl,
          description: post.description,
          matchedKeywords: post.matchedKeywords,
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          viewsCount: post.viewsCount || 0,
          sharesCount: post.sharesCount || 0,
          engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
          postDate: post.postDate ? (post.postDate instanceof Date ? post.postDate.toISOString().split('T')[0] : String(post.postDate).split('T')[0]) : undefined,
          influencerName: influencer?.influencerName,
          influencerUsername: influencer?.influencerUsername,
        };
      }),
      isPublic: report.isPublic,
      shareUrl: report.shareUrlToken ? `/collab-check/shared/${report.shareUrlToken}` : undefined,
      creditsUsed: report.creditsUsed,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
    };
  }
}
