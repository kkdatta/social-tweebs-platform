import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudienceOverlapController } from './audience-overlap.controller';
import { AudienceOverlapService } from './audience-overlap.service';
import {
  AudienceOverlapReport,
  AudienceOverlapInfluencer,
  AudienceOverlapShare,
} from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { CreditsModule } from '../credits/credits.module';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AudienceOverlapReport,
      AudienceOverlapInfluencer,
      AudienceOverlapShare,
      User,
      InfluencerProfile,
    ]),
    CreditsModule,
    DiscoveryModule,
  ],
  controllers: [AudienceOverlapController],
  providers: [AudienceOverlapService],
  exports: [AudienceOverlapService],
})
export class AudienceOverlapModule {}
