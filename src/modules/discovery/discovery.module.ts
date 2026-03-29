import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './services/discovery.service';
import { ModashService } from './services/modash.service';
import {
  InfluencerProfile,
  AudienceData,
  DiscoverySearch,
  SearchResult,
  InsightsAccess,
  ModashApiLog,
  ExportRecord,
} from './entities';
import { CreditsModule } from '../credits/credits.module';
import { InsightsModule } from '../insights/insights.module';
import { User } from '../users/entities/user.entity';
import { UnlockedInfluencer } from '../credits/entities/unlocked-influencer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InfluencerProfile,
      AudienceData,
      DiscoverySearch,
      SearchResult,
      InsightsAccess,
      ModashApiLog,
      ExportRecord,
      User,
      UnlockedInfluencer,
    ]),
    CreditsModule,
    forwardRef(() => InsightsModule),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, ModashService],
  exports: [DiscoveryService, ModashService],
})
export class DiscoveryModule {}
