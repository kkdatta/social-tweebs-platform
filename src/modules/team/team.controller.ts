import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { TeamService } from './team.service';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  UpdateFeaturesDto,
  UpdateActionsDto,
  AllocateTeamCreditsDto,
  TeamMemberResponseDto,
  TeamMemberQueryDto,
  CreditUsageLogDto,
  CreditLogQueryDto,
  CreditDetailQueryDto,
  ImpersonationResponseDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, CurrentUserPayload, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@ApiTags('Team Management')
@Controller('team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('members')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all team members' })
  @ApiResponse({ status: 200, description: 'Team members retrieved' })
  async getTeamMembers(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: TeamMemberQueryDto,
  ): Promise<{ data: TeamMemberResponseDto[]; total: number }> {
    return this.teamService.getTeamMembers(user.sub, query);
  }

  @Get('members/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get team member by ID' })
  @ApiResponse({ status: 200, description: 'Team member retrieved' })
  async getTeamMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
  ): Promise<TeamMemberResponseDto> {
    return this.teamService.getTeamMemberById(user.sub, memberId);
  }

  @Post('members')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new team member' })
  @ApiResponse({ status: 201, description: 'Team member created' })
  async createTeamMember(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamService.createTeamMember(user.sub, dto);
  }

  @Put('members/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update team member' })
  @ApiResponse({ status: 200, description: 'Team member updated' })
  async updateTeamMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamService.updateTeamMember(user.sub, memberId, dto);
  }

  @Delete('members/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete team member' })
  @ApiResponse({ status: 200, description: 'Team member deleted' })
  async deleteTeamMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
  ): Promise<{ success: boolean }> {
    await this.teamService.deleteTeamMember(user.sub, memberId);
    return { success: true };
  }

  @Get('members/:id/features')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get member feature access' })
  @ApiResponse({ status: 200, description: 'Features retrieved' })
  async getMemberFeatures(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
  ): Promise<{ featureName: string; isEnabled: boolean }[]> {
    return this.teamService.getMemberFeatures(user.sub, memberId);
  }

  @Put('members/:id/features')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update member feature access' })
  @ApiResponse({ status: 200, description: 'Features updated' })
  async updateMemberFeatures(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
    @Body() dto: UpdateFeaturesDto,
  ): Promise<{ success: boolean }> {
    await this.teamService.updateMemberFeatures(user.sub, memberId, dto);
    return { success: true };
  }

  @Get('members/:id/actions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get member action permissions' })
  @ApiResponse({ status: 200, description: 'Actions retrieved' })
  async getMemberActions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
  ): Promise<{ actionName: string; isEnabled: boolean }[]> {
    return this.teamService.getMemberActions(user.sub, memberId);
  }

  @Put('members/:id/actions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update member action permissions' })
  @ApiResponse({ status: 200, description: 'Actions updated' })
  async updateMemberActions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
    @Body() dto: UpdateActionsDto,
  ): Promise<{ success: boolean }> {
    await this.teamService.updateMemberActions(user.sub, memberId, dto);
    return { success: true };
  }

  @Post('members/:id/credits/allocate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Allocate credits to team member' })
  @ApiResponse({ status: 200, description: 'Credits allocated' })
  async allocateCredits(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') memberId: string,
    @Body() dto: AllocateTeamCreditsDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.teamService.allocateCreditsToMember(user.sub, memberId, dto);
  }

  @Post('members/:id/impersonate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Login as team member (impersonate)' })
  @ApiResponse({ status: 200, description: 'Impersonation started' })
  async impersonateUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') targetUserId: string,
    @Req() request: Request,
  ): Promise<ImpersonationResponseDto> {
    const ipAddress = request.ip || request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    return this.teamService.impersonateUser(
      user.sub,
      targetUserId,
      ipAddress,
      userAgent,
    );
  }

  @Post('impersonation/exit')
  @ApiOperation({ summary: 'Exit impersonation session' })
  @ApiResponse({ status: 200, description: 'Impersonation ended' })
  async exitImpersonation(
    @Body() body: { impersonationId: string },
  ): Promise<{ success: boolean }> {
    await this.teamService.exitImpersonation(body.impersonationId);
    return { success: true };
  }

  @Get('credit-logs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get credit usage logs for all team members' })
  @ApiResponse({ status: 200, description: 'Credit logs retrieved' })
  async getCreditUsageLogs(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: CreditLogQueryDto,
  ): Promise<{ data: CreditUsageLogDto[]; total: number }> {
    return this.teamService.getCreditUsageLogs(user.sub, query);
  }

  @Get('credit-logs/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get detailed credit usage for a user' })
  @ApiResponse({ status: 200, description: 'Credit details retrieved' })
  async getUserCreditDetails(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') userId: string,
    @Query() query: CreditDetailQueryDto,
  ): Promise<{ user: any; transactions: any[]; total: number }> {
    return this.teamService.getUserCreditDetails(user.sub, userId, query);
  }
}
