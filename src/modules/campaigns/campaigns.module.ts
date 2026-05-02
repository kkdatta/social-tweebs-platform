import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import {
  Campaign,
  CampaignInfluencer,
  CampaignDeliverable,
  CampaignMetric,
  CampaignPost,
  CampaignShare,
} from './entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { InfluencerInsight } from '../insights/entities/influencer-insight.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignInfluencer,
      CampaignDeliverable,
      CampaignMetric,
      CampaignPost,
      CampaignShare,
      User,
      InfluencerInsight,
    ]),
    CreditsModule,
    DiscoveryModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
