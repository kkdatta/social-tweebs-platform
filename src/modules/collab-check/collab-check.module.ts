import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollabCheckController } from './collab-check.controller';
import { CollabCheckService } from './collab-check.service';
import {
  CollabCheckReport,
  CollabCheckInfluencer,
  CollabCheckPost,
  CollabCheckShare,
} from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { InfluencerInsight } from '../insights/entities/influencer-insight.entity';
import { CreditsModule } from '../credits/credits.module';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CollabCheckReport,
      CollabCheckInfluencer,
      CollabCheckPost,
      CollabCheckShare,
      User,
      InfluencerProfile,
      InfluencerInsight,
    ]),
    CreditsModule,
    DiscoveryModule,
  ],
  controllers: [CollabCheckController],
  providers: [CollabCheckService],
  exports: [CollabCheckService],
})
export class CollabCheckModule {}
