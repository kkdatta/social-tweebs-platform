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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { GeneratedReportsService } from './generated-reports.service';
import {
  GeneratedReportsFilterDto,
  RenameReportDto,
  BulkDeleteReportsDto,
  ReportTab,
} from './dto';

@ApiTags('generated-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('generated-reports')
export class GeneratedReportsController {
  constructor(private readonly generatedReportsService: GeneratedReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of generated reports' })
  @ApiQuery({ name: 'tab', enum: ReportTab, required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'createdBy', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReports(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query() filters: GeneratedReportsFilterDto,
  ) {
    return this.generatedReportsService.getReports(userId, userRole, filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.generatedReportsService.getDashboardStats(userId, userRole);
  }

  @Get(':tab/:id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'tab', enum: ReportTab })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async getReportById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('tab') tab: ReportTab,
    @Param('id') reportId: string,
  ) {
    return this.generatedReportsService.getReportById(userId, userRole, reportId, tab);
  }

  @Patch(':tab/:id/rename')
  @ApiOperation({ summary: 'Rename a report' })
  @ApiParam({ name: 'tab', enum: ReportTab })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async renameReport(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('tab') tab: ReportTab,
    @Param('id') reportId: string,
    @Body() dto: RenameReportDto,
  ) {
    return this.generatedReportsService.renameReport(userId, userRole, reportId, tab, dto);
  }

  @Delete(':tab/:id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'tab', enum: ReportTab })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('tab') tab: ReportTab,
    @Param('id') reportId: string,
  ) {
    return this.generatedReportsService.deleteReport(userId, userRole, reportId, tab);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete reports' })
  async bulkDeleteReports(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: BulkDeleteReportsDto,
  ) {
    return this.generatedReportsService.bulkDeleteReports(userId, userRole, dto);
  }

  @Post(':tab/:id/download')
  @ApiOperation({ summary: 'Re-download a report' })
  @ApiParam({ name: 'tab', enum: ReportTab })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async downloadReport(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('tab') tab: ReportTab,
    @Param('id') reportId: string,
  ) {
    return this.generatedReportsService.downloadReport(userId, userRole, reportId, tab);
  }
}
