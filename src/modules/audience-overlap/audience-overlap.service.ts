import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import {
  AudienceOverlapReport,
  AudienceOverlapInfluencer,
  AudienceOverlapShare,
  OverlapReportStatus,
  OverlapSharePermission,
} from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { CreditsService } from '../credits/credits.service';
import { ModashService } from '../discovery/services/modash.service';
import { ActionType, ModuleType, PlatformType } from '../../common/enums';
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

const CREDIT_PER_INFLUENCER = 1;
const FREE_LIFETIME_QUERIES = 10;
const DEFAULT_REPORT_QUOTA = 50;

@Injectable()
export class AudienceOverlapService {
  private readonly logger = new Logger(AudienceOverlapService.name);

  constructor(
    @InjectRepository(AudienceOverlapReport)
    private readonly reportRepo: Repository<AudienceOverlapReport>,
    @InjectRepository(AudienceOverlapInfluencer)
    private readonly influencerRepo: Repository<AudienceOverlapInfluencer>,
    @InjectRepository(AudienceOverlapShare)
    private readonly shareRepo: Repository<AudienceOverlapShare>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InfluencerProfile)
    private readonly profileRepo: Repository<InfluencerProfile>,
    private readonly creditsService: CreditsService,
    private readonly modashService: ModashService,
  ) {}

  /**
   * Get the client admin ID for a user (for client-level queries).
   */
  private async getClientAdminId(userId: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return userId;
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? userId : (user.parentId || userId);
  }

  /**
   * Get lifetime overlap query count for a client account.
   */
  private async getClientOverlapQueryCount(clientAdminId: string): Promise<number> {
    const children = await this.userRepo.find({
      where: { parentId: clientAdminId },
      select: ['id'],
    });
    const allUserIds = [clientAdminId, ...children.map((c) => c.id)];

    return this.reportRepo.count({
      where: { ownerId: In(allUserIds) },
    });
  }

  /**
   * Create a new audience overlap report.
   * Charges 1 credit per influencer. First 10 queries per client lifetime are free.
   */
  async createReport(userId: string, dto: CreateOverlapReportDto): Promise<{ success: boolean; report: AudienceOverlapReport; creditsUsed: number }> {
    if (dto.influencerIds.length < 2) {
      throw new BadRequestException('At least 2 influencers are required for audience overlap analysis');
    }

    const clientAdminId = await this.getClientAdminId(userId);
    const queryCount = await this.getClientOverlapQueryCount(clientAdminId);

    // Per spec: 1 credit per influencer, but first 10 lifetime queries are free
    const influencerCount = dto.influencerIds.length;
    let creditsToCharge = influencerCount * CREDIT_PER_INFLUENCER;

    if (queryCount < FREE_LIFETIME_QUERIES) {
      creditsToCharge = 0;
      this.logger.log(`Audience overlap: client has ${queryCount}/${FREE_LIFETIME_QUERIES} free queries used — this query is FREE`);
    }

    // Check if there's already an IN_PROCESS report
    const inProcessReport = await this.reportRepo.findOne({
      where: { ownerId: userId, status: OverlapReportStatus.IN_PROCESS },
    });
    const initialStatus = inProcessReport ? OverlapReportStatus.PENDING : OverlapReportStatus.IN_PROCESS;

    // Create report first (in case Modash fails, we can refund/retry)
    const report = new AudienceOverlapReport();
    report.title = dto.title || 'Untitled';
    report.platform = dto.platform;
    report.status = initialStatus;
    report.ownerId = userId;
    report.createdById = userId;
    report.shareUrlToken = `share_${uuidv4().substring(0, 8)}`;

    const savedReport = await this.reportRepo.save(report);

    const influencers = await this.addInfluencersToReport(savedReport.id, dto.influencerIds, dto.platform);

    if (initialStatus === OverlapReportStatus.IN_PROCESS) {
      setTimeout(() => this.processReportAndCharge(savedReport.id, userId, creditsToCharge), 2000);
    }

    savedReport.influencers = influencers;

    return {
      success: true,
      report: savedReport,
      creditsUsed: creditsToCharge,
    };
  }

  /**
   * Process report with Modash, then charge credits only on success (universal refresh guard).
   */
  private async processReportAndCharge(reportId: string, userId: string, creditsToCharge: number): Promise<void> {
    try {
      await this.processReport(reportId);

      // Only deduct credits AFTER successful Modash processing
      if (creditsToCharge > 0) {
        await this.creditsService.deductCredits(userId, {
          actionType: ActionType.REPORT_GENERATION,
          quantity: creditsToCharge,
          module: ModuleType.AUDIENCE_OVERLAP,
          resourceId: reportId,
          resourceType: 'overlap_report_creation',
        });
      }
    } catch (error) {
      this.logger.error(`Overlap report ${reportId} failed — NO credits charged: ${error.message}`);
    }
  }

  /**
   * Add influencers to a report
   */
  private async addInfluencersToReport(reportId: string, influencerIds: string[], platform: string): Promise<AudienceOverlapInfluencer[]> {
    const profiles = await this.profileRepo.find({ where: { id: In(influencerIds) } });
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const influencers: AudienceOverlapInfluencer[] = [];

    for (let i = 0; i < influencerIds.length; i++) {
      const profile = profileMap.get(influencerIds[i]);
      const influencer = new AudienceOverlapInfluencer();
      influencer.reportId = reportId;
      influencer.influencerProfileId = influencerIds[i];
      influencer.platform = platform;
      influencer.displayOrder = i + 1;
      influencer.influencerName = profile?.fullName || profile?.username || `Influencer ${i + 1}`;
      influencer.influencerUsername = profile?.username || profile?.platformUserId || `unknown_${i + 1}`;
      influencer.followerCount = profile?.followerCount || 0;

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
      if (this.modashService.isModashEnabled()) {
        await this.processReportWithModash(report);
      } else {
        await this.processReportSimulated(report);
      }

      await this.processPendingReports(report.ownerId);
    } catch (error) {
      report.status = OverlapReportStatus.FAILED;
      report.errorMessage = error.message || 'Processing failed';
      await this.reportRepo.save(report);
    }
  }

  private async processReportWithModash(report: AudienceOverlapReport): Promise<void> {
    this.logger.log(`Processing audience overlap via Modash API for report ${report.id}`);

    const handles = report.influencers.map(
      (inf) => inf.influencerUsername || inf.influencerName,
    );

    const platformMap: Record<string, PlatformType> = {
      instagram: PlatformType.INSTAGRAM,
      youtube: PlatformType.YOUTUBE,
      tiktok: PlatformType.TIKTOK,
    };
    const platform = platformMap[report.platform?.toLowerCase()] || PlatformType.INSTAGRAM;

    const modashResult = await this.modashService.getAudienceOverlap(
      platform,
      handles,
      report.ownerId,
    );

    if (modashResult.error) {
      throw new Error('Modash audience overlap API returned an error');
    }

    const { reportInfo, data } = modashResult;

    report.totalFollowers = reportInfo.totalFollowers;
    report.uniqueFollowers = reportInfo.totalUniqueFollowers;
    report.overlappingFollowers = reportInfo.totalFollowers - reportInfo.totalUniqueFollowers;
    report.overlapPercentage = reportInfo.totalFollowers > 0
      ? Number((((reportInfo.totalFollowers - reportInfo.totalUniqueFollowers) / reportInfo.totalFollowers) * 100).toFixed(2))
      : 0;
    report.uniquePercentage = reportInfo.totalFollowers > 0
      ? Number(((reportInfo.totalUniqueFollowers / reportInfo.totalFollowers) * 100).toFixed(2))
      : 0;
    report.status = OverlapReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);

    for (const influencer of report.influencers) {
      const match = data.find(
        (d) =>
          d.username?.toLowerCase() === influencer.influencerUsername?.toLowerCase() ||
          d.userId === influencer.influencerProfileId,
      );

      if (match) {
        influencer.followerCount = match.followers;
        influencer.uniquePercentage = Number(match.uniquePercentage.toFixed(2));
        influencer.overlappingPercentage = Number(match.overlappingPercentage.toFixed(2));
        influencer.uniqueFollowers = Math.floor(match.followers * (match.uniquePercentage / 100));
        influencer.overlappingFollowers = match.followers - influencer.uniqueFollowers;
      }

      await this.influencerRepo.save(influencer);
    }

    this.logger.log(`Audience overlap report ${report.id} completed with Modash data`);
  }

  private async processReportSimulated(report: AudienceOverlapReport): Promise<void> {
    const totalFollowers = report.influencers.reduce((sum, inf) => sum + inf.followerCount, 0);
    const overlapPercentage = Math.random() * 30 + 10;
    const overlappingFollowers = Math.floor(totalFollowers * (overlapPercentage / 100));
    const uniqueFollowers = totalFollowers - overlappingFollowers;

    report.totalFollowers = totalFollowers;
    report.uniqueFollowers = uniqueFollowers;
    report.overlappingFollowers = overlappingFollowers;
    report.overlapPercentage = Number(overlapPercentage.toFixed(2));
    report.uniquePercentage = Number((100 - overlapPercentage).toFixed(2));
    report.status = OverlapReportStatus.COMPLETED;
    report.completedAt = new Date();
    await this.reportRepo.save(report);

    for (const influencer of report.influencers) {
      const uniquePct = Math.random() * 30 + 60;
      influencer.uniquePercentage = Number(uniquePct.toFixed(2));
      influencer.overlappingPercentage = Number((100 - uniquePct).toFixed(2));
      influencer.uniqueFollowers = Math.floor(influencer.followerCount * (uniquePct / 100));
      influencer.overlappingFollowers = influencer.followerCount - influencer.uniqueFollowers;
      await this.influencerRepo.save(influencer);
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

      // Recalculate credits for the queued report
      const clientAdminId = await this.getClientAdminId(userId);
      const queryCount = await this.getClientOverlapQueryCount(clientAdminId);
      const influencerCount = await this.influencerRepo.count({ where: { reportId: pendingReport.id } });
      let creditsToCharge = influencerCount * CREDIT_PER_INFLUENCER;
      if (queryCount < FREE_LIFETIME_QUERIES) creditsToCharge = 0;

      setTimeout(() => this.processReportAndCharge(pendingReport.id, userId, creditsToCharge), 2000);
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

    const influencerCount = report.influencers?.length || 2;
    const retryCredits = influencerCount * CREDIT_PER_INFLUENCER;

    // Reset and reprocess — credits deducted after success via processReportAndCharge
    report.status = OverlapReportStatus.IN_PROCESS;
    report.errorMessage = undefined;
    report.retryCount += 1;
    const savedReport = await this.reportRepo.save(report);

    setTimeout(() => this.processReportAndCharge(reportId, userId, retryCredits), 2000);

    return { success: true, report: savedReport, creditsUsed: retryCredits };
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

    report.isPublic = true;
    await this.reportRepo.save(report);

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

  /**
   * Download report as XLSX
   */
  async downloadReportAsXlsx(userId: string, reportId: string): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['influencers'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkReportAccess(userId, report);

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      { Metric: 'Report Title', Value: report.title },
      { Metric: 'Platform', Value: report.platform },
      { Metric: 'Status', Value: report.status },
      { Metric: 'Created', Value: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '' },
      { Metric: '', Value: '' },
      { Metric: 'Total Followers', Value: report.totalFollowers },
      { Metric: 'Unique Followers', Value: report.uniqueFollowers },
      { Metric: 'Overlapping Followers', Value: report.overlappingFollowers },
      { Metric: 'Overlap Rate (%)', Value: report.overlapPercentage ? Number(report.overlapPercentage).toFixed(2) : '0' },
      { Metric: 'Unique Rate (%)', Value: report.uniquePercentage ? Number(report.uniquePercentage).toFixed(2) : '0' },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const influencers = (report.influencers || []).sort((a, b) => a.displayOrder - b.displayOrder);
    const influencerData = influencers.map(inf => ({
      'Influencer Name': inf.influencerName,
      'Username': inf.influencerUsername || '',
      'Platform': inf.platform,
      'Followers': inf.followerCount,
      'Unique Followers': inf.uniqueFollowers,
      'Unique (%)': inf.uniquePercentage ? Number(inf.uniquePercentage).toFixed(2) : '0',
      'Overlapping Followers': inf.overlappingFollowers,
      'Overlap (%)': inf.overlappingPercentage ? Number(inf.overlappingPercentage).toFixed(2) : '0',
    }));

    if (influencerData.length > 0) {
      const infSheet = XLSX.utils.json_to_sheet(influencerData);
      infSheet['!cols'] = [
        { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
        { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(workbook, infSheet, 'Influencer Analysis');
    }

    const buffer = Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
    const filename = `Audience_Overlap_${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { buffer, filename };
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
