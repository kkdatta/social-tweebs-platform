import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  CompetitionAnalysisReport,
  CompetitionBrand,
  CompetitionInfluencer,
  CompetitionPost,
  CompetitionShare,
  CompetitionReportStatus,
  SharePermission,
  InfluencerCategory,
  PostType,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ActionType, ModuleType } from '../../common/enums';
import {
  CreateCompetitionReportDto,
  UpdateCompetitionReportDto,
  ShareCompetitionReportDto,
  CompetitionReportFilterDto,
  CompetitionReportListResponseDto,
  CompetitionReportDetailDto,
  CompetitionInfluencerDto,
  CompetitionPostDto,
  BrandSummaryDto,
  CategoryStatsDto,
  PostTypeStatsDto,
  DashboardStatsDto,
  ChartDataDto,
  PostsFilterDto,
  InfluencersFilterDto,
} from './dto';

const CREDIT_PER_REPORT = 1;

// Brand colors for charts
const BRAND_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
];

@Injectable()
export class CompetitionAnalysisService {
  constructor(
    @InjectRepository(CompetitionAnalysisReport)
    private readonly reportRepo: Repository<CompetitionAnalysisReport>,
    @InjectRepository(CompetitionBrand)
    private readonly brandRepo: Repository<CompetitionBrand>,
    @InjectRepository(CompetitionInfluencer)
    private readonly influencerRepo: Repository<CompetitionInfluencer>,
    @InjectRepository(CompetitionPost)
    private readonly postRepo: Repository<CompetitionPost>,
    @InjectRepository(CompetitionShare)
    private readonly shareRepo: Repository<CompetitionShare>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly creditsService: CreditsService,
  ) {}

  /**
   * Create a new competition analysis report
   * Costs 1 credit per report
   */
  async createReport(
    userId: string,
    dto: CreateCompetitionReportDto,
  ): Promise<{ success: boolean; report: CompetitionAnalysisReport; creditsUsed: number }> {
    // Validate brands (2-5)
    if (dto.brands.length < 2 || dto.brands.length > 5) {
      throw new BadRequestException('Competition analysis requires 2-5 brands');
    }

    // Validate each brand has at least one search criteria
    for (const brand of dto.brands) {
      if (!brand.hashtags?.length && !brand.username && !brand.keywords?.length) {
        throw new BadRequestException(`Brand "${brand.brandName}" must have at least one of: hashtags, username, or keywords`);
      }
    }

    // Check and deduct credits
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_GENERATION,
      quantity: CREDIT_PER_REPORT,
      module: ModuleType.COMPETITION_ANALYSIS,
      resourceId: 'new-competition-report',
      resourceType: 'competition_report_creation',
    });

    // Create report
    const report = new CompetitionAnalysisReport();
    report.title = dto.title || 'Untitled Competition Report';
    report.platforms = dto.platforms;
    report.dateRangeStart = new Date(dto.dateRangeStart);
    report.dateRangeEnd = new Date(dto.dateRangeEnd);
    report.autoRefreshEnabled = dto.autoRefreshEnabled || false;
    report.status = CompetitionReportStatus.PENDING;
    report.ownerId = userId;
    report.createdById = userId;
    report.shareUrlToken = `comp_${uuidv4().substring(0, 8)}`;
    report.creditsUsed = CREDIT_PER_REPORT;
    report.totalBrands = dto.brands.length;

    if (dto.autoRefreshEnabled) {
      const nextRefresh = new Date();
      nextRefresh.setDate(nextRefresh.getDate() + 1);
      report.nextRefreshDate = nextRefresh;
    }

    const savedReport = await this.reportRepo.save(report);

    // Create brand entries
    for (let i = 0; i < dto.brands.length; i++) {
      const brandDto = dto.brands[i];
      const brand = new CompetitionBrand();
      brand.reportId = savedReport.id;
      brand.brandName = brandDto.brandName;
      brand.hashtags = brandDto.hashtags || [];
      brand.username = brandDto.username;
      brand.keywords = brandDto.keywords || [];
      brand.displayColor = BRAND_COLORS[i % BRAND_COLORS.length];
      brand.displayOrder = i;
      await this.brandRepo.save(brand);
    }

    // Trigger async processing
    setTimeout(() => this.processReport(savedReport.id), 2000);

    return { success: true, report: savedReport, creditsUsed: CREDIT_PER_REPORT };
  }

  /**
   * Process report (simulate analysis)
   */
  private async processReport(reportId: string): Promise<void> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['brands'],
    });
    if (!report) return;

    try {
      // Update status to IN_PROGRESS
      report.status = CompetitionReportStatus.IN_PROGRESS;
      await this.reportRepo.save(report);
      await new Promise(resolve => setTimeout(resolve, 1000));

      let totalInfluencers = 0;
      let totalPosts = 0;
      let totalLikes = 0;
      let totalViews = 0;
      let totalComments = 0;
      let totalShares = 0;
      let totalFollowers = 0;

      // Process each brand
      for (const brand of report.brands) {
        const brandResult = await this.processBrand(reportId, brand, report);
        
        totalInfluencers += brandResult.influencerCount;
        totalPosts += brandResult.postsCount;
        totalLikes += brandResult.totalLikes;
        totalViews += brandResult.totalViews;
        totalComments += brandResult.totalComments;
        totalShares += brandResult.totalShares;
        totalFollowers += brandResult.totalFollowers;
      }

      // Update report metrics
      report.totalInfluencers = totalInfluencers;
      report.totalPosts = totalPosts;
      report.totalLikes = totalLikes;
      report.totalViews = totalViews;
      report.totalComments = totalComments;
      report.totalShares = totalShares;
      report.totalFollowers = totalFollowers;
      report.avgEngagementRate = totalPosts > 0 && totalFollowers > 0
        ? ((totalLikes + totalComments) / (totalPosts * (totalFollowers / totalInfluencers))) * 100
        : 0;
      report.status = CompetitionReportStatus.COMPLETED;
      report.completedAt = new Date();
      await this.reportRepo.save(report);

    } catch (error) {
      report.status = CompetitionReportStatus.FAILED;
      report.errorMessage = error.message || 'Processing failed';
      await this.reportRepo.save(report);
    }
  }

  /**
   * Process a single brand
   */
  private async processBrand(
    reportId: string,
    brand: CompetitionBrand,
    report: CompetitionAnalysisReport,
  ): Promise<{
    influencerCount: number;
    postsCount: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    totalFollowers: number;
  }> {
    // Generate random influencers for this brand
    const influencerCount = Math.floor(Math.random() * 15) + 5;
    
    let brandPosts = 0;
    let brandLikes = 0;
    let brandViews = 0;
    let brandComments = 0;
    let brandShares = 0;
    let brandFollowers = 0;
    
    let nanoCount = 0, microCount = 0, macroCount = 0, megaCount = 0;
    let photoCount = 0, videoCount = 0, carouselCount = 0, reelCount = 0;

    const searchTerms: string[] = [
      ...(brand.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`),
      brand.username ? (brand.username.startsWith('@') ? brand.username : `@${brand.username}`) : '',
      ...(brand.keywords || []),
    ].filter(t => t && t.length > 0);

    for (let i = 0; i < influencerCount; i++) {
      const followerCount = this.generateFollowerCount();
      const category = this.categorizeInfluencer(followerCount);
      
      // Count by category
      switch (category) {
        case InfluencerCategory.NANO: nanoCount++; break;
        case InfluencerCategory.MICRO: microCount++; break;
        case InfluencerCategory.MACRO: macroCount++; break;
        case InfluencerCategory.MEGA: megaCount++; break;
      }

      const influencer = new CompetitionInfluencer();
      influencer.reportId = reportId;
      influencer.brandId = brand.id;
      influencer.platform = report.platforms[Math.floor(Math.random() * report.platforms.length)];
      influencer.influencerName = this.generateInfluencerName();
      influencer.influencerUsername = influencer.influencerName.toLowerCase().replace(/\s/g, '_');
      influencer.platformUserId = `user_${Date.now()}_${brand.id}_${i}`;
      influencer.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.influencerName)}&background=random`;
      influencer.followerCount = followerCount;
      influencer.category = category;
      influencer.audienceCredibility = Math.floor(Math.random() * 30) + 70;
      influencer.displayOrder = i;

      const savedInfluencer = await this.influencerRepo.save(influencer);

      // Generate posts for this influencer
      const postsCount = Math.floor(Math.random() * 8) + 2;
      let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;

      for (let j = 0; j < postsCount; j++) {
        const postType = this.getRandomPostType();
        
        // Count by post type
        switch (postType) {
          case PostType.PHOTO: photoCount++; break;
          case PostType.VIDEO: videoCount++; break;
          case PostType.CAROUSEL: carouselCount++; break;
          case PostType.REEL: reelCount++; break;
        }

        const post = new CompetitionPost();
        post.reportId = reportId;
        post.brandId = brand.id;
        post.influencerId = savedInfluencer.id;
        post.platform = savedInfluencer.platform;
        post.postId = `post_${Date.now()}_${brand.id}_${i}_${j}`;
        post.postType = postType;
        post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + i + j}`;
        
        // Generate description with matched terms
        const matchedTerms = searchTerms.filter(() => Math.random() > 0.3);
        post.description = `Amazing ${brand.brandName} content! ${matchedTerms.join(' ')} #influencer`;
        post.matchedHashtags = matchedTerms.filter(t => t.startsWith('#'));
        post.matchedUsername = matchedTerms.find(t => t.startsWith('@')) || undefined;
        post.matchedKeywords = matchedTerms.filter(t => !t.startsWith('#') && !t.startsWith('@'));
        
        post.likesCount = Math.floor(Math.random() * 12000) + 500;
        post.commentsCount = Math.floor(Math.random() * 600) + 20;
        post.viewsCount = Math.floor(Math.random() * 70000) + 2000;
        post.sharesCount = Math.floor(Math.random() * 300) + 10;
        post.engagementRate = ((post.likesCount + post.commentsCount) / savedInfluencer.followerCount) * 100;
        post.isSponsored = Math.random() > 0.75;
        
        // Random date within the report's date range
        const startMs = new Date(report.dateRangeStart).getTime();
        const endMs = new Date(report.dateRangeEnd).getTime();
        const randomMs = startMs + Math.random() * (endMs - startMs);
        post.postDate = new Date(randomMs);
        post.postUrl = `https://instagram.com/p/${post.postId}`;

        await this.postRepo.save(post);

        infLikes += post.likesCount;
        infViews += post.viewsCount;
        infComments += post.commentsCount;
        infShares += post.sharesCount;
      }

      // Update influencer metrics
      savedInfluencer.postsCount = postsCount;
      savedInfluencer.likesCount = infLikes;
      savedInfluencer.viewsCount = infViews;
      savedInfluencer.commentsCount = infComments;
      savedInfluencer.sharesCount = infShares;
      savedInfluencer.avgEngagementRate = ((infLikes + infComments) / (postsCount * savedInfluencer.followerCount)) * 100;
      await this.influencerRepo.save(savedInfluencer);

      brandPosts += postsCount;
      brandLikes += infLikes;
      brandViews += infViews;
      brandComments += infComments;
      brandShares += infShares;
      brandFollowers += savedInfluencer.followerCount;
    }

    // Update brand metrics
    brand.influencerCount = influencerCount;
    brand.postsCount = brandPosts;
    brand.totalLikes = brandLikes;
    brand.totalViews = brandViews;
    brand.totalComments = brandComments;
    brand.totalShares = brandShares;
    brand.totalFollowers = brandFollowers;
    brand.avgEngagementRate = brandPosts > 0 && brandFollowers > 0
      ? ((brandLikes + brandComments) / (brandPosts * (brandFollowers / influencerCount))) * 100
      : 0;
    brand.nanoCount = nanoCount;
    brand.microCount = microCount;
    brand.macroCount = macroCount;
    brand.megaCount = megaCount;
    brand.photoCount = photoCount;
    brand.videoCount = videoCount;
    brand.carouselCount = carouselCount;
    brand.reelCount = reelCount;
    await this.brandRepo.save(brand);

    return {
      influencerCount,
      postsCount: brandPosts,
      totalLikes: brandLikes,
      totalViews: brandViews,
      totalComments: brandComments,
      totalShares: brandShares,
      totalFollowers: brandFollowers,
    };
  }

  private getRandomPostType(): PostType {
    const types = [PostType.PHOTO, PostType.VIDEO, PostType.CAROUSEL, PostType.REEL];
    const weights = [35, 25, 15, 25]; // Percentage distribution
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) return types[i];
    }
    return PostType.PHOTO;
  }

  private generateFollowerCount(): number {
    const ranges = [
      { min: 1000, max: 10000, weight: 30 },
      { min: 10000, max: 100000, weight: 40 },
      { min: 100000, max: 500000, weight: 20 },
      { min: 500000, max: 5000000, weight: 10 },
    ];
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const range of ranges) {
      cumulative += range.weight;
      if (random <= cumulative) {
        return Math.floor(Math.random() * (range.max - range.min)) + range.min;
      }
    }
    return 50000;
  }

  private categorizeInfluencer(followers: number): InfluencerCategory {
    if (followers < 10000) return InfluencerCategory.NANO;
    if (followers < 100000) return InfluencerCategory.MICRO;
    if (followers < 500000) return InfluencerCategory.MACRO;
    return InfluencerCategory.MEGA;
  }

  private generateInfluencerName(): string {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Peyton', 'Dakota'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Anderson'];
    const suffixes = ['', 'Official', 'HQ', 'Live', 'Daily'];
    
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${first} ${last}${suffix ? ' ' + suffix : ''}`;
  }

  /**
   * Get list of reports with filters
   */
  async getReports(userId: string, filters: CompetitionReportFilterDto): Promise<CompetitionReportListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepo.createQueryBuilder('report');

    // Filter by tab/created by
    if (filters.createdBy === 'ME') {
      queryBuilder.where('report.createdById = :userId', { userId });
    } else if (filters.createdBy === 'TEAM') {
      const teamUserIds = await this.getTeamUserIds(userId);
      queryBuilder.where('report.createdById IN (:...teamUserIds) AND report.createdById != :userId', { teamUserIds, userId });
    } else if (filters.createdBy === 'SHARED') {
      const sharedReportIds = await this.shareRepo.find({
        where: { sharedWithUserId: userId },
        select: ['reportId'],
      });
      const reportIds = sharedReportIds.map(s => s.reportId);
      if (reportIds.length === 0) {
        return { reports: [], total: 0, page, limit, hasMore: false };
      }
      queryBuilder.where('report.id IN (:...reportIds)', { reportIds });
    } else {
      // ALL - show user's reports, team reports, and shared reports
      const teamUserIds = await this.getTeamUserIds(userId);
      const sharedReportIds = await this.shareRepo.find({
        where: { sharedWithUserId: userId },
        select: ['reportId'],
      });
      const reportIds = sharedReportIds.map(s => s.reportId);
      
      queryBuilder.where(
        '(report.createdById = :userId OR report.createdById IN (:...teamUserIds) OR report.id IN (:...reportIds) OR report.isPublic = true)',
        { userId, teamUserIds, reportIds: reportIds.length > 0 ? reportIds : ['none'] }
      );
    }

    // Filter by platform
    if (filters.platform && filters.platform !== 'ALL') {
      queryBuilder.andWhere(':platform = ANY(report.platforms)', { platform: filters.platform });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    // Search
    if (filters.search) {
      queryBuilder.andWhere(
        'LOWER(report.title) LIKE :search',
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
  async getReportById(userId: string, reportId: string): Promise<CompetitionReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['brands', 'influencers', 'posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    return this.toDetailDto(report);
  }

  /**
   * Get report by share token
   */
  async getReportByShareToken(token: string): Promise<CompetitionReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['brands', 'influencers', 'posts'],
    });

    if (!report) {
      throw new NotFoundException('Report not found or not publicly shared');
    }

    return this.toDetailDto(report);
  }

  /**
   * Update report
   */
  async updateReport(userId: string, reportId: string, dto: UpdateCompetitionReportDto): Promise<{ success: boolean; report: CompetitionAnalysisReport }> {
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
   * Bulk delete reports
   */
  async bulkDeleteReports(userId: string, reportIds: string[]): Promise<{ success: boolean; deletedCount: number }> {
    let deletedCount = 0;
    
    for (const reportId of reportIds) {
      try {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (report && (report.createdById === userId || report.ownerId === userId)) {
          await this.reportRepo.remove(report);
          deletedCount++;
        }
      } catch {
        // Continue with other deletions
      }
    }

    return { success: true, deletedCount };
  }

  /**
   * Retry failed report
   */
  async retryReport(userId: string, reportId: string): Promise<{ success: boolean; report: CompetitionAnalysisReport; creditsUsed: number }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['brands'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (report.status !== CompetitionReportStatus.FAILED) {
      throw new BadRequestException('Only failed reports can be retried');
    }

    // Deduct credits for retry
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_REFRESH,
      quantity: CREDIT_PER_REPORT,
      module: ModuleType.COMPETITION_ANALYSIS,
      resourceId: reportId,
      resourceType: 'competition_report_retry',
    });

    // Delete existing data
    await this.postRepo.delete({ reportId });
    await this.influencerRepo.delete({ reportId });

    // Reset brand metrics
    for (const brand of report.brands) {
      brand.influencerCount = 0;
      brand.postsCount = 0;
      brand.totalLikes = 0;
      brand.totalViews = 0;
      brand.totalComments = 0;
      brand.totalShares = 0;
      await this.brandRepo.save(brand);
    }

    // Reset report
    report.status = CompetitionReportStatus.PENDING;
    report.errorMessage = undefined;
    report.retryCount += 1;
    report.creditsUsed += CREDIT_PER_REPORT;
    report.totalInfluencers = 0;
    report.totalPosts = 0;
    report.totalLikes = 0;
    report.totalViews = 0;
    report.totalComments = 0;
    report.totalShares = 0;
    await this.reportRepo.save(report);

    // Trigger processing
    setTimeout(() => this.processReport(reportId), 2000);

    return { success: true, report, creditsUsed: CREDIT_PER_REPORT };
  }

  /**
   * Share report
   */
  async shareReport(userId: string, reportId: string, dto: ShareCompetitionReportDto): Promise<{ success: boolean; shareUrl?: string }> {
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
        const share = new CompetitionShare();
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

    const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/competition-analysis/shared/${report.shareUrlToken}`;

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
    const completedReports = allReports.filter(r => r.status === CompetitionReportStatus.COMPLETED);

    const totalBrandsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalBrands || 0), 0);
    const totalInfluencersAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalInfluencers || 0), 0);
    const totalPostsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalPosts || 0), 0);
    const avgEngagement = completedReports.length > 0
      ? completedReports.reduce((sum, r) => sum + (Number(r.avgEngagementRate) || 0), 0) / completedReports.length
      : 0;

    return {
      totalReports: allReports.length,
      completedReports: completedReports.length,
      inProgressReports: allReports.filter(r => r.status === CompetitionReportStatus.IN_PROGRESS).length,
      pendingReports: allReports.filter(r => r.status === CompetitionReportStatus.PENDING).length,
      failedReports: allReports.filter(r => r.status === CompetitionReportStatus.FAILED).length,
      reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
      totalBrandsAnalyzed,
      totalInfluencersAnalyzed,
      totalPostsAnalyzed,
      avgEngagementRate: Number(avgEngagement.toFixed(2)),
    };
  }

  /**
   * Get chart data for posts over time (per brand)
   */
  async getChartData(userId: string, reportId: string): Promise<ChartDataDto[]> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['brands'],
    });
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const posts = await this.postRepo.find({ where: { reportId } });
    const brands = report.brands || [];

    // Group posts by date and brand
    const grouped: Record<string, Record<string, number>> = {};
    
    posts.forEach(post => {
      const dateStr = post.postDate ? new Date(post.postDate).toISOString().split('T')[0] : 'Unknown';
      if (!grouped[dateStr]) {
        grouped[dateStr] = {};
        brands.forEach(b => { grouped[dateStr][b.id] = 0; });
      }
      if (post.brandId && grouped[dateStr][post.brandId] !== undefined) {
        grouped[dateStr][post.brandId] += 1;
      }
    });

    // Create brand name mapping
    const brandNameMap: Record<string, string> = {};
    brands.forEach(b => { brandNameMap[b.id] = b.brandName; });

    return Object.entries(grouped)
      .map(([date, brandPosts]) => {
        const namedBrandPosts: Record<string, number> = {};
        Object.entries(brandPosts).forEach(([brandId, count]) => {
          namedBrandPosts[brandNameMap[brandId] || brandId] = count;
        });
        return {
          date,
          brandPosts: namedBrandPosts,
          totalPosts: Object.values(brandPosts).reduce((sum, c) => sum + c, 0),
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get posts with filters
   */
  async getPosts(userId: string, reportId: string, filters: PostsFilterDto): Promise<{ posts: CompetitionPostDto[]; total: number; page: number; limit: number }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['brands'],
    });
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.influencer', 'influencer')
      .leftJoinAndSelect('post.brand', 'brand')
      .where('post.reportId = :reportId', { reportId });

    // Filter by brand
    if (filters.brandId) {
      queryBuilder.andWhere('post.brandId = :brandId', { brandId: filters.brandId });
    }

    // Filter by category
    if (filters.category && filters.category !== 'ALL') {
      queryBuilder.andWhere('influencer.category = :category', { category: filters.category });
    }

    // Sorting
    const sortField = filters.sortBy || 'postDate';
    const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const sortMap: Record<string, string> = {
      'recent': 'post.postDate',
      'postDate': 'post.postDate',
      'likes': 'post.likesCount',
      'views': 'post.viewsCount',
      'comments': 'post.commentsCount',
      'engagement': 'post.engagementRate',
    };
    
    queryBuilder.orderBy(sortMap[sortField] || 'post.postDate', sortOrder as 'ASC' | 'DESC');

    const [posts, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      posts: posts.map(p => this.toPostDto(p)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get influencers with filters
   */
  async getInfluencers(userId: string, reportId: string, filters: InfluencersFilterDto): Promise<{ influencers: CompetitionInfluencerDto[]; total: number; page: number; limit: number }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['brands'],
    });
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.influencerRepo.createQueryBuilder('influencer')
      .leftJoinAndSelect('influencer.brand', 'brand')
      .where('influencer.reportId = :reportId', { reportId });

    // Filter by brand
    if (filters.brandId) {
      queryBuilder.andWhere('influencer.brandId = :brandId', { brandId: filters.brandId });
    }

    // Filter by category
    if (filters.category && filters.category !== 'ALL') {
      queryBuilder.andWhere('influencer.category = :category', { category: filters.category });
    }

    // Sorting
    const sortField = filters.sortBy || 'likesCount';
    const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const sortMap: Record<string, string> = {
      'recent': 'influencer.createdAt',
      'likes': 'influencer.likesCount',
      'followers': 'influencer.followerCount',
      'comments': 'influencer.commentsCount',
      'credibility': 'influencer.audienceCredibility',
      'engagement': 'influencer.avgEngagementRate',
    };
    
    queryBuilder.orderBy(sortMap[sortField] || 'influencer.likesCount', sortOrder as 'ASC' | 'DESC');

    const [influencers, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      influencers: influencers.map(i => this.toInfluencerDto(i)),
      total,
      page,
      limit,
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

  private async checkReportAccess(userId: string, report: CompetitionAnalysisReport, level: 'view' | 'edit' = 'view'): Promise<void> {
    if (report.ownerId === userId || report.createdById === userId) return;

    // Check if public
    if (report.isPublic && level === 'view') return;

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

  private toSummaryDto(report: CompetitionAnalysisReport): any {
    return {
      id: report.id,
      title: report.title,
      platforms: report.platforms,
      status: report.status,
      dateRangeStart: report.dateRangeStart?.toISOString().split('T')[0],
      dateRangeEnd: report.dateRangeEnd?.toISOString().split('T')[0],
      totalBrands: report.totalBrands || 0,
      totalPosts: report.totalPosts || 0,
      totalInfluencers: report.totalInfluencers || 0,
      creditsUsed: report.creditsUsed,
      createdAt: report.createdAt,
    };
  }

  private toDetailDto(report: CompetitionAnalysisReport): CompetitionReportDetailDto {
    // Calculate categorization stats
    const categorization = this.calculateCategorization(report.influencers || []);
    const postTypeBreakdown = this.calculatePostTypeBreakdown(report.brands || []);

    return {
      id: report.id,
      title: report.title,
      platforms: report.platforms,
      status: report.status,
      errorMessage: report.errorMessage,
      dateRangeStart: report.dateRangeStart?.toISOString().split('T')[0],
      dateRangeEnd: report.dateRangeEnd?.toISOString().split('T')[0],
      autoRefreshEnabled: report.autoRefreshEnabled,
      totalBrands: report.totalBrands || 0,
      totalInfluencers: report.totalInfluencers || 0,
      totalPosts: report.totalPosts || 0,
      totalLikes: Number(report.totalLikes) || 0,
      totalViews: Number(report.totalViews) || 0,
      totalComments: Number(report.totalComments) || 0,
      totalShares: Number(report.totalShares) || 0,
      avgEngagementRate: report.avgEngagementRate ? Number(report.avgEngagementRate) : undefined,
      totalFollowers: Number(report.totalFollowers) || 0,
      brands: (report.brands || []).map(b => this.toBrandSummaryDto(b)),
      influencers: (report.influencers || []).slice(0, 50).map(i => this.toInfluencerDto(i)),
      posts: (report.posts || []).slice(0, 50).map(p => this.toPostDto(p)),
      categorization,
      postTypeBreakdown,
      isPublic: report.isPublic,
      shareUrl: report.shareUrlToken ? `/competition-analysis/shared/${report.shareUrlToken}` : undefined,
      creditsUsed: report.creditsUsed,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
    };
  }

  private toBrandSummaryDto(brand: CompetitionBrand): BrandSummaryDto {
    return {
      id: brand.id,
      brandName: brand.brandName,
      hashtags: brand.hashtags,
      username: brand.username,
      keywords: brand.keywords,
      displayColor: brand.displayColor,
      influencerCount: brand.influencerCount || 0,
      postsCount: brand.postsCount || 0,
      totalLikes: Number(brand.totalLikes) || 0,
      totalViews: Number(brand.totalViews) || 0,
      totalComments: Number(brand.totalComments) || 0,
      totalShares: Number(brand.totalShares) || 0,
      totalFollowers: Number(brand.totalFollowers) || 0,
      avgEngagementRate: brand.avgEngagementRate ? Number(brand.avgEngagementRate) : undefined,
      photoCount: brand.photoCount || 0,
      videoCount: brand.videoCount || 0,
      carouselCount: brand.carouselCount || 0,
      reelCount: brand.reelCount || 0,
      nanoCount: brand.nanoCount || 0,
      microCount: brand.microCount || 0,
      macroCount: brand.macroCount || 0,
      megaCount: brand.megaCount || 0,
    };
  }

  private toInfluencerDto(inf: CompetitionInfluencer): CompetitionInfluencerDto {
    return {
      id: inf.id,
      brandId: inf.brandId,
      brandName: inf.brand?.brandName || '',
      influencerName: inf.influencerName,
      influencerUsername: inf.influencerUsername,
      platform: inf.platform,
      profilePictureUrl: inf.profilePictureUrl,
      followerCount: Number(inf.followerCount) || 0,
      category: inf.category,
      audienceCredibility: inf.audienceCredibility ? Number(inf.audienceCredibility) : undefined,
      postsCount: inf.postsCount || 0,
      likesCount: Number(inf.likesCount) || 0,
      viewsCount: Number(inf.viewsCount) || 0,
      commentsCount: Number(inf.commentsCount) || 0,
      sharesCount: Number(inf.sharesCount) || 0,
      avgEngagementRate: inf.avgEngagementRate ? Number(inf.avgEngagementRate) : undefined,
    };
  }

  private toPostDto(post: CompetitionPost): CompetitionPostDto {
    return {
      id: post.id,
      brandId: post.brandId,
      brandName: post.brand?.brandName || '',
      platform: post.platform,
      postUrl: post.postUrl,
      postType: post.postType,
      thumbnailUrl: post.thumbnailUrl,
      description: post.description,
      matchedHashtags: post.matchedHashtags,
      matchedUsername: post.matchedUsername,
      matchedKeywords: post.matchedKeywords,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      viewsCount: post.viewsCount || 0,
      sharesCount: post.sharesCount || 0,
      engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
      isSponsored: post.isSponsored,
      postDate: post.postDate ? (post.postDate instanceof Date ? post.postDate.toISOString().split('T')[0] : String(post.postDate).split('T')[0]) : undefined,
      influencerName: post.influencer?.influencerName,
      influencerUsername: post.influencer?.influencerUsername,
    };
  }

  private calculateCategorization(influencers: CompetitionInfluencer[]): CategoryStatsDto[] {
    const categories: Record<string, { 
      count: number; 
      followers: number; 
      posts: number; 
      likes: number; 
      views: number;
      comments: number;
      shares: number;
    }> = {
      ALL: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      NANO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      MICRO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      MACRO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
      MEGA: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
    };

    const labels: Record<string, string> = {
      ALL: 'All Influencers',
      NANO: 'Nano (<10K)',
      MICRO: 'Micro (10K-100K)',
      MACRO: 'Macro (100K-500K)',
      MEGA: 'Mega (>500K)',
    };

    for (const inf of influencers) {
      const cat = inf.category || 'NANO';
      
      categories[cat].count += 1;
      categories[cat].followers += Number(inf.followerCount) || 0;
      categories[cat].posts += inf.postsCount || 0;
      categories[cat].likes += Number(inf.likesCount) || 0;
      categories[cat].views += Number(inf.viewsCount) || 0;
      categories[cat].comments += Number(inf.commentsCount) || 0;
      categories[cat].shares += Number(inf.sharesCount) || 0;

      categories.ALL.count += 1;
      categories.ALL.followers += Number(inf.followerCount) || 0;
      categories.ALL.posts += inf.postsCount || 0;
      categories.ALL.likes += Number(inf.likesCount) || 0;
      categories.ALL.views += Number(inf.viewsCount) || 0;
      categories.ALL.comments += Number(inf.commentsCount) || 0;
      categories.ALL.shares += Number(inf.sharesCount) || 0;
    }

    return Object.entries(categories).map(([key, data]) => ({
      category: key,
      label: labels[key],
      accountsCount: data.count,
      followersCount: data.followers,
      postsCount: data.posts,
      likesCount: data.likes,
      viewsCount: data.views,
      commentsCount: data.comments,
      sharesCount: data.shares,
      engagementRate: data.posts > 0 && data.followers > 0
        ? ((data.likes + data.comments) / (data.posts * (data.followers / data.count))) * 100
        : 0,
    }));
  }

  private calculatePostTypeBreakdown(brands: CompetitionBrand[]): PostTypeStatsDto[] {
    return brands.map(brand => {
      const total = brand.photoCount + brand.videoCount + brand.carouselCount + brand.reelCount;
      return {
        brandId: brand.id,
        brandName: brand.brandName,
        photoCount: brand.photoCount,
        videoCount: brand.videoCount,
        carouselCount: brand.carouselCount,
        reelCount: brand.reelCount,
        photoPercentage: total > 0 ? (brand.photoCount / total) * 100 : 0,
        videoPercentage: total > 0 ? (brand.videoCount / total) * 100 : 0,
        carouselPercentage: total > 0 ? (brand.carouselCount / total) * 100 : 0,
        reelPercentage: total > 0 ? (brand.reelCount / total) * 100 : 0,
      };
    });
  }
}
