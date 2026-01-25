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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InfluencerGroupService } from './influencer-group.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupFilterDto,
  AddInfluencerDto,
  BulkAddInfluencersDto,
  ImportFromGroupDto,
  CopyInfluencersDto,
  RemoveInfluencersDto,
  MemberFilterDto,
  ShareGroupDto,
  CreateInvitationDto,
  UpdateInvitationDto,
  SubmitApplicationDto,
  ApplicationFilterDto,
  BulkApproveApplicationsDto,
  BulkRejectApplicationsDto,
} from './dto/influencer-group.dto';
import { Request } from 'express';

@ApiTags('influencer-groups')
@Controller('influencer-groups')
export class InfluencerGroupController {
  constructor(private readonly groupService: InfluencerGroupService) {}

  // ============ GROUP ENDPOINTS ============

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new influencer group' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  async createGroup(@CurrentUser('id') userId: string, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of groups with filters' })
  @ApiQuery({ name: 'tab', required: false, enum: ['created_by_me', 'created_by_team', 'shared_with_me'] })
  async getGroups(@CurrentUser('id') userId: string, @Query() filters: GroupFilterDto) {
    return this.groupService.getGroups(userId, filters);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(@CurrentUser('id') userId: string) {
    return this.groupService.getDashboardStats(userId);
  }

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get publicly shared group' })
  @ApiParam({ name: 'token', description: 'Share URL token' })
  async getSharedGroup(@Param('token') token: string) {
    return this.groupService.getSharedGroup(token);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get group details by ID' })
  async getGroupById(@CurrentUser('id') userId: string, @Param('id') groupId: string) {
    return this.groupService.getGroupById(userId, groupId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update group' })
  async updateGroup(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(userId, groupId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete group' })
  async deleteGroup(@CurrentUser('id') userId: string, @Param('id') groupId: string) {
    await this.groupService.deleteGroup(userId, groupId);
  }

  // ============ MEMBER ENDPOINTS ============

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an influencer to the group' })
  async addInfluencer(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: AddInfluencerDto,
  ) {
    return this.groupService.addInfluencer(userId, groupId, dto);
  }

  @Post(':id/members/bulk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk add influencers (XLSX import)' })
  async bulkAddInfluencers(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: BulkAddInfluencersDto,
  ) {
    return this.groupService.bulkAddInfluencers(userId, groupId, dto);
  }

  @Post(':id/members/import')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import influencers from another group' })
  async importFromGroup(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: ImportFromGroupDto,
  ) {
    return this.groupService.importFromGroup(userId, groupId, dto);
  }

  @Post(':id/members/copy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Copy influencers to another group' })
  async copyInfluencers(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: CopyInfluencersDto,
  ) {
    return this.groupService.copyInfluencers(userId, groupId, dto);
  }

  @Delete(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove influencers from group (bulk)' })
  async removeInfluencers(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: RemoveInfluencersDto,
  ) {
    return this.groupService.removeInfluencers(userId, groupId, dto);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get group members with filters' })
  async getMembers(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Query() filters: MemberFilterDto,
  ) {
    return this.groupService.getMembers(userId, groupId, filters);
  }

  // ============ SHARE ENDPOINTS ============

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share group with a user or make public' })
  async shareGroup(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: ShareGroupDto,
  ) {
    return this.groupService.shareGroup(userId, groupId, dto);
  }

  @Delete(':id/share/:shareId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove group share' })
  async removeShare(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('shareId') shareId: string,
  ) {
    await this.groupService.removeShare(userId, groupId, shareId);
  }

  // ============ INVITATION ENDPOINTS ============

  @Post(':id/invitations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invitation for the group' })
  async createInvitation(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.groupService.createInvitation(userId, groupId, dto);
  }

  @Get(':id/invitations/:invitationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invitation details' })
  async getInvitation(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.groupService.getInvitation(userId, groupId, invitationId);
  }

  @Patch(':id/invitations/:invitationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update invitation' })
  async updateInvitation(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('invitationId') invitationId: string,
    @Body() dto: UpdateInvitationDto,
  ) {
    return this.groupService.updateInvitation(userId, groupId, invitationId, dto);
  }

  @Delete(':id/invitations/:invitationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete invitation' })
  async deleteInvitation(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('invitationId') invitationId: string,
  ) {
    await this.groupService.deleteInvitation(userId, groupId, invitationId);
  }

  // ============ PUBLIC INVITATION ENDPOINTS ============

  @Get('invite/:slug')
  @ApiOperation({ summary: 'Get invitation form by URL slug (public)' })
  async getInvitationBySlug(@Param('slug') slug: string) {
    return this.groupService.getInvitationBySlug(slug);
  }

  @Post('invite/:slug/apply')
  @ApiOperation({ summary: 'Submit an application via invitation (public)' })
  async submitApplication(
    @Param('slug') slug: string,
    @Body() dto: SubmitApplicationDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];
    return this.groupService.submitApplication(slug, dto, ipAddress, userAgent);
  }

  // ============ APPLICATION ENDPOINTS ============

  @Get(':id/invitations/:invitationId/applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get applications for an invitation' })
  async getApplications(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('invitationId') invitationId: string,
    @Query() filters: ApplicationFilterDto,
  ) {
    return this.groupService.getApplications(userId, groupId, invitationId, filters);
  }

  @Post(':id/applications/:applicationId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve an application' })
  async approveApplication(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.groupService.approveApplication(userId, groupId, applicationId);
  }

  @Post(':id/applications/bulk-approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk approve applications' })
  async bulkApproveApplications(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: BulkApproveApplicationsDto,
  ) {
    return this.groupService.bulkApproveApplications(userId, groupId, dto);
  }

  @Post(':id/applications/:applicationId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject an application' })
  async rejectApplication(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('applicationId') applicationId: string,
    @Body('reason') reason?: string,
  ) {
    return this.groupService.rejectApplication(userId, groupId, applicationId, reason);
  }

  @Post(':id/applications/bulk-reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk reject applications' })
  async bulkRejectApplications(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: BulkRejectApplicationsDto,
  ) {
    return this.groupService.bulkRejectApplications(userId, groupId, dto);
  }
}
