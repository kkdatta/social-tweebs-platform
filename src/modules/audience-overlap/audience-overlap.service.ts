import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  AudienceOverlapReport,
  AudienceOverlapInfluencer,
  AudienceOverlapShare,
  OverlapReportStatus,
  OverlapSharePermission,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ActionType, ModuleType } from '../../common/enums';
import {
  CreateOverlapReportDto,
  UpdateOverlapReportDto,
  ShareOverlapReportDto,
  OverlapReportFilterDto,
  OverlapReportListResponseDto,
  OverlapReportDetailDto,
  DashboardStatsDto,
  InfluencerSummaryDto,
} from './dto';

const CREDIT_PER_REPORT = 1;
const DEFAULT_REPORT_QUOTA = 50; // Reports per month

@Injectable()
export class AudienceOverlapService {
  constructor(
    @InjectRepository(AudienceOverlapReport)
    private readonly reportRepo: Repository<AudienceOverlapReport>,
    @InjectRepository(AudienceOverlapInfluencer)
    private readonly influencerRepo: Repository<AudienceOverlapInfluencer>,
    @InjectRepository(AudienceOverlapShare)
    private readonly shareRepo: Repository<AudienceOverlapShare>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly creditsService: CreditsService,
  ) {}

  /**
   * Create a new audience overlap report
   */
  async createReport(userId: string, dto: CreateOverlapReportDto): Promise<{ success: boolean; report: AudienceOverlapReport; creditsUsed: number }> {
    // Validate minimum influencers
    if (dto.influencerIds.length < 2) {
      throw new BadRequestException('At least 2 influencers are required for audience overlap analysis');
    }

    // Check if there's already an IN_PROCESS report
    const inProcessReport = await this.reportRepo.findOne({
      where: { ownerId: userId, status: OverlapReportStatus.IN_PROCESS },
    });

    const initialStatus = inProcessReport ? OverlapReportStatus.PENDING : OverlapReportStatus.IN_PROCESS;

    // Deduct credits
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_GENERATION,
      quantity: CREDIT_PER_REPORT,
      module: ModuleType.AUDIENCE_OVERLAP,
      resourceId: 'new-overlap-report',
      resourceType: 'overlap_report_creation',
    });

    // Create report
    const report = new AudienceOverlapReport();
    report.title = dto.title || 'Untitled';
    report.platform = dto.platform;
    report.status = initialStatus;
    report.ownerId = userId;
    report.createdById = userId;
    report.shareUrlToken = `share_${uuidv4().substring(0, 8)}`;

    const savedReport = await this.reportRepo.save(report);

    // Add influencers (fetch from cached_influencer_profiles)
    const influencers = await this.addInfluencersToReport(savedReport.id, dto.influencerIds, dto.platform);

    // Simulate processing for IN_PROCESS reports
    if (initialStatus === OverlapReportStatus.IN_PROCESS) {
      // In a real app, this would be a background job
      setTimeout(() => this.processReport(savedReport.id), 2000);
    }

    savedReport.influencers = influencers;

    return {
      success: true,
      report: savedReport,
      creditsUsed: CREDIT_PER_REPORT,
    };
  }

  /**
   * Add influencers to a report
   */
  private async addInfluencersToReport(reportId: string, influencerIds: string[], platform: string): Promise<AudienceOverlapInfluencer[]> {
    const influencers: AudienceOverlapInfluencer[] = [];

    for (let i = 0; i < influencerIds.length; i++) {
      // In a real app, fetch from cached_influencer_profiles
      const influencer = new AudienceOverlapInfluencer();
      influencer.reportId = reportId;
      influencer.influencerProfileId = influencerIds[i];
      influencer.platform = platform;
      influencer.displayOrder = i + 1;
      
      // Placeholder data - would be fetched from cached profiles
      influencer.influencerName = `Influencer ${i + 1}`;
      influencer.influencerUsername = `influencer_${i + 1}`;
      influencer.followerCount = Math.floor(Math.random() * 100000) + 10000;
      
      influencers.push(await this.influencerRepo.save(influencer));
    }

    return influencers;
  }

  /**
   * Simulate report processing (in real app, this would call external API)
   */
  private async processReport(reportId: string): Promise<void> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['influencers'],
    });

    if (!report) return;

    try {
      // Simulate calculation
      const totalFollowers = report.influencers.reduce((sum, inf) => sum + inf.followerCount, 0);
      const overlapPercentage = Math.random() * 30 + 10; // 10-40% overlap
      const overlappingFollowers = Math.floor(totalFollowers * (overlapPercentage / 100));
      const uniqueFollowers = totalFollowers - overlappingFollowers;

      // Update report metrics
      report.totalFollowers = totalFollowers;
      report.uniqueFollowers = uniqueFollowers;
      report.overlappingFollowers = overlappingFollowers;
      report.overlapPercentage = Number(overlapPercentage.toFixed(2));
      report.uniquePercentage = Number((100 - overlapPercentage).toFixed(2));
      report.status = OverlapReportStatus.COMPLETED;
      report.completedAt = new Date();

      await this.reportRepo.save(report);

      // Update individual influencer metrics
      for (const influencer of report.influencers) {
        const uniquePct = Math.random() * 30 + 60; // 60-90% unique
        influencer.uniquePercentage = Number(uniquePct.toFixed(2));
        influencer.overlappingPercentage = Number((100 - uniquePct).toFixed(2));
        influencer.uniqueFollowers = Math.floor(influencer.followerCount * (uniquePct / 100));
        influencer.overlappingFollowers = influencer.followerCount - influencer.uniqueFollowers;
        await this.influencerRepo.save(influencer);
      }

      // Process any pending reports
      await this.processPendingReports(report.ownerId);
    } catch (error) {
      report.status = OverlapReportStatus.FAILED;
      report.errorMessage = error.message || 'Processing failed';
      await this.reportRepo.save(report);
    }
  }

  /**
   * Process pending reports after one completes
   */
  private async processPendingReports(userId: string): Promise<void> {
    const pendingReport = await this.reportRepo.findOne({
      where: { ownerId: userId, status: OverlapReportStatus.PENDING },
      order: { createdAt: 'ASC' },
    });

    if (pendingReport) {
      pendingReport.status = OverlapReportStatus.IN_PROCESS;
      await this.reportRepo.save(pendingReport);
      setTimeout(() => this.processReport(pendingReport.id), 2000);
    }
  }

  /**
   * Get list of reports with filters
   */
  async getReports(userId: string, filters: OverlapReportFilterDto): Promise<OverlapReportListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepo.createQueryBuilder('report')
      .leftJoinAndSelect('report.influencers', 'influencers')
      .leftJoinAndSelect('report.createdBy', 'createdBy');

    // Filter by created by
    if (filters.createdBy === 'ME') {
      queryBuilder.where('report.createdById = :userId', { userId });
    } else if (filters.createdBy === 'TEAM') {
      const teamUserIds = await this.getTeamUserIds(userId);
      queryBuilder.where('report.createdById IN (:...teamUserIds)', { teamUserIds });
    } else {
      // ALL - show user's reports + shared + team
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

    // Search by title
    if (filters.search) {
      queryBuilder.andWhere('LOWER(report.title) LIKE :search', { search: `%${filters.search.toLowerCase()}%` });
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
  async getReportById(userId: string, reportId: string): Promise<OverlapReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['influencers', 'owner', 'createdBy'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Check access
    await this.checkReportAccess(userId, report);

    return this.toDetailDto(report);
  }

  /**
   * Get report by share token (public access)
   */
  async getReportByShareToken(token: string): Promise<OverlapReportDetailDto> {
    const report = await this.reportRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['influencers'],
    });

    if (!report) {
      throw new NotFoundException('Report not found or not publicly shared');
    }

    return this.toDetailDto(report);
  }

  /**
   * Update report
   */
  async updateReport(userId: string, reportId: string, dto: UpdateOverlapReportDto): Promise<{ success: boolean; report: AudienceOverlapReport }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['influencers'],
    });

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
   * Retry failed report
   */
  async retryReport(userId: string, reportId: string): Promise<{ success: boolean; report: AudienceOverlapReport; creditsUsed: number }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['influencers'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    if (report.status !== OverlapReportStatus.FAILED) {
      throw new BadRequestException('Only failed reports can be retried');
    }

    // Deduct credits
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_GENERATION,
      quantity: CREDIT_PER_REPORT,
      module: ModuleType.AUDIENCE_OVERLAP,
      resourceId: reportId,
      resourceType: 'overlap_report_retry',
    });

    // Reset and reprocess
    report.status = OverlapReportStatus.IN_PROCESS;
    report.errorMessage = undefined;
    report.retryCount += 1;
    const savedReport = await this.reportRepo.save(report);

    // Trigger processing
    setTimeout(() => this.processReport(reportId), 2000);

    return { success: true, report: savedReport, creditsUsed: CREDIT_PER_REPORT };
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
  async shareReport(userId: string, reportId: string, dto: ShareOverlapReportDto): Promise<{ success: boolean; shareUrl?: string }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report, 'edit');

    // If sharing with specific user
    if (dto.sharedWithUserId) {
      const share = new AudienceOverlapShare();
      share.reportId = reportId;
      share.sharedWithUserId = dto.sharedWithUserId;
      share.sharedByUserId = userId;
      share.permissionLevel = dto.permissionLevel || OverlapSharePermission.VIEW;
      await this.shareRepo.save(share);
    }

    // Generate share URL
    const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/audience-overlap/shared/${report.shareUrlToken}`;

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

    const reportsThisMonth = allReports.filter(r => r.createdAt >= startOfMonth).length;

    return {
      totalReports: allReports.length,
      completedReports: allReports.filter(r => r.status === OverlapReportStatus.COMPLETED).length,
      pendingReports: allReports.filter(r => r.status === OverlapReportStatus.PENDING).length,
      inProcessReports: allReports.filter(r => r.status === OverlapReportStatus.IN_PROCESS).length,
      failedReports: allReports.filter(r => r.status === OverlapReportStatus.FAILED).length,
      reportsThisMonth,
      remainingQuota: DEFAULT_REPORT_QUOTA - reportsThisMonth,
    };
  }

  /**
   * Search influencers for adding to report
   */
  async searchInfluencers(platform: string, query: string, limit: number = 10): Promise<any[]> {
    // This would search cached_influencer_profiles
    // For now, return mock data
    return [];
  }

  // Helper methods
  private async getTeamUserIds(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [userId];

    // Get parent and children
    const teamMembers = await this.userRepo.find({
      where: [
        { id: user.parentId || undefined },
        { parentId: userId },
        { parentId: user.parentId || undefined },
      ],
    });

    return [userId, ...teamMembers.map(m => m.id)];
  }

  private async checkReportAccess(userId: string, report: AudienceOverlapReport, level: 'view' | 'edit' = 'view'): Promise<void> {
    // Owner has full access
    if (report.ownerId === userId || report.createdById === userId) return;

    // Check shares
    const share = await this.shareRepo.findOne({
      where: { reportId: report.id, sharedWithUserId: userId },
    });

    if (share) {
      if (level === 'edit' && share.permissionLevel === OverlapSharePermission.VIEW) {
        throw new ForbiddenException('Edit access required');
      }
      return;
    }

    // Check team
    const teamUserIds = await this.getTeamUserIds(userId);
    if (teamUserIds.includes(report.createdById)) {
      if (level === 'edit') {
        throw new ForbiddenException('Cannot edit team member reports');
      }
      return;
    }

    throw new ForbiddenException('No access to this report');
  }

  private toSummaryDto(report: AudienceOverlapReport): any {
    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      status: report.status,
      overlapPercentage: report.overlapPercentage ? Number(report.overlapPercentage) : undefined,
      influencerCount: report.influencers?.length || 0,
      influencers: (report.influencers || [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(inf => ({
          id: inf.id,
          influencerName: inf.influencerName,
          influencerUsername: inf.influencerUsername,
          platform: inf.platform,
          profilePictureUrl: inf.profilePictureUrl,
          followerCount: inf.followerCount,
        })),
      createdAt: report.createdAt,
      createdById: report.createdById,
    };
  }

  private toDetailDto(report: AudienceOverlapReport): OverlapReportDetailDto {
    return {
      id: report.id,
      title: report.title,
      platform: report.platform,
      status: report.status,
      totalFollowers: report.totalFollowers,
      uniqueFollowers: report.uniqueFollowers,
      overlappingFollowers: report.overlappingFollowers,
      overlapPercentage: report.overlapPercentage ? Number(report.overlapPercentage) : undefined,
      uniquePercentage: report.uniquePercentage ? Number(report.uniquePercentage) : undefined,
      influencers: (report.influencers || [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(inf => ({
          id: inf.id,
          influencerName: inf.influencerName,
          influencerUsername: inf.influencerUsername,
          platform: inf.platform,
          profilePictureUrl: inf.profilePictureUrl,
          followerCount: inf.followerCount,
          uniqueFollowers: inf.uniqueFollowers,
          uniquePercentage: inf.uniquePercentage ? Number(inf.uniquePercentage) : undefined,
          overlappingFollowers: inf.overlappingFollowers,
          overlappingPercentage: inf.overlappingPercentage ? Number(inf.overlappingPercentage) : undefined,
        })),
      isPublic: report.isPublic,
      shareUrl: report.shareUrlToken ? `/audience-overlap/shared/${report.shareUrlToken}` : undefined,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      errorMessage: report.errorMessage,
      retryCount: report.retryCount,
      ownerId: report.ownerId,
      createdById: report.createdById,
    };
  }
}
