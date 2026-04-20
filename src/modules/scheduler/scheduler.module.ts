import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { User } from '../users/entities/user.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { UnlockedInfluencer } from '../credits/entities/unlocked-influencer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CreditAccount, UnlockedInfluencer])],
  providers: [SchedulerService],
})
export class SchedulerModule {}
