import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentionTrackingController } from './mention-tracking.controller';
import { MentionTrackingService } from './mention-tracking.service';
import {
  MentionTrackingReport,
  MentionTrackingInfluencer,
  MentionTrackingPost,
  MentionTrackingShare,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MentionTrackingReport,
      MentionTrackingInfluencer,
      MentionTrackingPost,
      MentionTrackingShare,
      User,
    ]),
    CreditsModule,
  ],
  controllers: [MentionTrackingController],
  providers: [MentionTrackingService],
  exports: [MentionTrackingService],
})
export class MentionTrackingModule {}
