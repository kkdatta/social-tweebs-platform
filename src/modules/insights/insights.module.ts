import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import {
  InfluencerInsight,
  SystemConfig,
  InsightAccessLog,
} from './entities';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InfluencerInsight,
      SystemConfig,
      InsightAccessLog,
      InfluencerProfile, // For querying local profiles when Modash is disabled
      User,
    ]),
    CreditsModule,
    forwardRef(() => DiscoveryModule), // For ModashService
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
