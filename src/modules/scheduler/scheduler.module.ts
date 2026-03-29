import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { User } from '../users/entities/user.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CreditAccount])],
  providers: [SchedulerService],
})
export class SchedulerModule {}
