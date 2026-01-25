import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import {
  GetBalanceResponseDto,
  AllocateCreditsDto,
  DeductCreditsDto,
  DeductCreditsResponseDto,
  UnblurInfluencersDto,
  UnblurInfluencersResponseDto,
  GetTransactionsQueryDto,
  CreditTransactionDto,
  CreditUsageChartDto,
  CreditUsageLogsQueryDto,
  CreditUsageLogsResponseDto,
  UserCreditDetailQueryDto,
  UserCreditDetailResponseDto,
  CreditGuideDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, CurrentUserPayload, Roles } from '../../common/decorators';
import { UserRole, PlatformType } from '../../common/enums';

@ApiTags('Credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current credit balance' })
  @ApiResponse({ status: 200, description: 'Credit balance retrieved', type: GetBalanceResponseDto })
  async getBalance(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<GetBalanceResponseDto> {
    return this.creditsService.getBalance(user.sub);
  }

  @Post('allocate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Allocate credits to a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credits allocated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async allocateCredits(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AllocateCreditsDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.creditsService.allocateCredits(dto, user.sub);
  }

  @Post('deduct')
  @ApiOperation({ summary: 'Deduct credits for an action' })
  @ApiResponse({ status: 200, description: 'Credits deducted', type: DeductCreditsResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  async deductCredits(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: DeductCreditsDto,
  ): Promise<DeductCreditsResponseDto> {
    return this.creditsService.deductCredits(user.sub, dto);
  }

  @Post('influencer/unblur')
  @ApiOperation({ summary: 'Unblur influencer profiles' })
  @ApiResponse({ status: 200, description: 'Influencers unblurred', type: UnblurInfluencersResponseDto })
  async unblurInfluencers(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UnblurInfluencersDto,
  ): Promise<UnblurInfluencersResponseDto> {
    return this.creditsService.unblurInfluencers(user.sub, dto);
  }

  @Get('influencer/check/:influencerId')
  @ApiOperation({ summary: 'Check if influencer is already unlocked' })
  @ApiResponse({ status: 200, description: 'Returns unlock status' })
  async checkInfluencerUnlocked(
    @CurrentUser() user: CurrentUserPayload,
    @Param('influencerId') influencerId: string,
    @Query('platform') platform: PlatformType,
  ): Promise<{ isUnlocked: boolean }> {
    const isUnlocked = await this.creditsService.isInfluencerUnlocked(
      user.sub,
      influencerId,
      platform,
    );
    return { isUnlocked };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  async getTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetTransactionsQueryDto,
  ): Promise<{ data: CreditTransactionDto[]; total: number }> {
    return this.creditsService.getTransactions(user.sub, query);
  }

  @Get('usage-chart')
  @ApiOperation({ summary: 'Get credit usage chart data' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved', type: CreditUsageChartDto })
  async getCreditUsageChart(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days: number = 30,
  ): Promise<CreditUsageChartDto> {
    return this.creditsService.getCreditUsageChart(user.sub, days);
  }

  // ============ CREDIT GUIDE ============

  @Get('guide')
  @ApiOperation({ summary: 'Get credit usage guide' })
  @ApiResponse({ status: 200, description: 'Credit guide retrieved', type: CreditGuideDto })
  getCreditGuide(): CreditGuideDto {
    return this.creditsService.getCreditGuide();
  }

  // ============ ANALYTICS / USAGE LOGS (Admin Only) ============

  @Get('analytics/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get analytics summary for team (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved' })
  async getAnalyticsSummary(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{
    totalTeamMembers: number;
    totalCreditsAllocated: number;
    totalCreditsUsed: number;
    activeUsers: number;
    usageByModule: Record<string, number>;
  }> {
    return this.creditsService.getAnalyticsSummary(user.sub);
  }

  @Get('usage-logs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get credit usage logs for all team members (Admin only)' })
  @ApiResponse({ status: 200, description: 'Usage logs retrieved', type: CreditUsageLogsResponseDto })
  async getCreditUsageLogs(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: CreditUsageLogsQueryDto,
  ): Promise<CreditUsageLogsResponseDto> {
    return this.creditsService.getCreditUsageLogs(user.sub, query);
  }

  @Get('usage-logs/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get detailed credit usage for a specific user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User credit details retrieved', type: UserCreditDetailResponseDto })
  async getUserCreditDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') targetUserId: string,
    @Query() query: UserCreditDetailQueryDto,
  ): Promise<UserCreditDetailResponseDto> {
    return this.creditsService.getUserCreditDetail(user.sub, targetUserId, query);
  }
}
