import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { User } from '../users/entities/user.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { UnlockedInfluencer } from '../credits/entities/unlocked-influencer.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { MentionTrackingReport } from '../mention-tracking/entities';
import { MentionTrackingModule } from '../mention-tracking/mention-tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CreditAccount, UnlockedInfluencer, Campaign, MentionTrackingReport]),
    MentionTrackingModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
