import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomErService } from './custom-er.service';
import {
  CreateCustomErReportDto,
  UpdateCustomErReportDto,
  ShareCustomErReportDto,
  CustomErReportFilterDto,
  CustomErReportListResponseDto,
  CustomErReportDetailDto,
  DashboardStatsDto,
  PostSummaryDto,
} from './dto';

@ApiTags('custom-er')
@Controller('custom-er')
export class CustomErController {
  constructor(private readonly customErService: CustomErService) {}

  // ==================== Public Access ====================

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get publicly shared report by token' })
  @ApiParam({ name: 'token', description: 'Share URL token' })
  @ApiResponse({ status: 200, type: CustomErReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found or not public' })
  async getSharedReport(@Param('token') token: string): Promise<CustomErReportDetailDto> {
    return this.customErService.getReportByShareToken(token);
  }

  // ==================== Report CRUD ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new custom ER report (FREE - no credits)' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCustomErReportDto,
  ) {
    return this.customErService.createReport(userId, dto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create reports by uploading Excel file with influencer URLs' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        platform: { type: 'string', enum: ['INSTAGRAM', 'TIKTOK'] },
        dateRangeStart: { type: 'string', format: 'date' },
        dateRangeEnd: { type: 'string', format: 'date' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Reports created from uploaded file' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('platform') platform: string,
    @Body('dateRangeStart') dateRangeStart: string,
    @Body('dateRangeEnd') dateRangeEnd: string,
  ) {
    return this.customErService.createReportsFromExcel(userId, file, platform, dateRangeStart, dateRangeEnd);
  }

  @Get('sample-file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download sample Excel file for bulk upload' })
  @ApiResponse({ status: 200, description: 'Sample Excel file' })
  async downloadSampleFile(@Res() res: Response) {
    const buffer = this.customErService.generateSampleExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="custom_er_sample.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of custom ER reports' })
  @ApiQuery({ name: 'platform', required: false, enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: CustomErReportListResponseDto })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: CustomErReportFilterDto,
  ): Promise<CustomErReportListResponseDto> {
    return this.customErService.getReports(userId, filters);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(@CurrentUser('id') userId: string): Promise<DashboardStatsDto> {
    return this.customErService.getDashboardStats(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report details by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, type: CustomErReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ): Promise<CustomErReportDetailDto> {
    return this.customErService.getReportById(userId, reportId);
  }

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts for a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiQuery({ name: 'sponsoredOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [PostSummaryDto] })
  async getReportPosts(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Query('sponsoredOnly') sponsoredOnly?: string,
  ): Promise<PostSummaryDto[]> {
    return this.customErService.getReportPosts(userId, reportId, sponsoredOnly === 'true');
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download report as XLSX' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'XLSX file download' })
  async downloadReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.customErService.downloadReportAsXlsx(userId, reportId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report (visibility)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report updated' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: UpdateCustomErReportDto,
  ) {
    return this.customErService.updateReport(userId, reportId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.customErService.deleteReport(userId, reportId);
  }

  // ==================== Report Actions ====================

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry a failed report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report retry triggered' })
  @ApiResponse({ status: 400, description: 'Report is not in FAILED status' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async retryReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.customErService.retryReport(userId, reportId);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share report with user or get shareable link' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report shared' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: ShareCustomErReportDto,
  ) {
    return this.customErService.shareReport(userId, reportId, dto);
  }

}
