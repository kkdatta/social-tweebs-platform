import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { UnlockedInfluencer } from '../credits/entities/unlocked-influencer.entity';
import { UserStatus } from '../../common/enums';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CreditAccount)
    private readonly creditAccountRepo: Repository<CreditAccount>,
    @InjectRepository(UnlockedInfluencer)
    private readonly unlockedInfluencerRepo: Repository<UnlockedInfluencer>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAccountExpiryChecks(): Promise<void> {
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 5);

    const accounts = await this.creditAccountRepo
      .createQueryBuilder('ca')
      .leftJoinAndSelect('ca.user', 'user')
      .where('ca.validityEnd > :now', { now })
      .andWhere('ca.validityEnd <= :limit', { limit })
      .getMany();

    const notifyDays = new Set([5, 4, 3, 2]);

    for (const account of accounts) {
      const user = account.user;
      if (!user || user.status !== UserStatus.ACTIVE) continue;

      const daysLeft = Math.ceil(
        (account.validityEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (!notifyDays.has(daysLeft)) continue;

      await this.mailService.sendAccountExpiryReminder(user.email, user.name, daysLeft);
    }

    this.logger.log(`Account expiry check processed ${accounts.length} account(s) in window`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleAccountLocking(): Promise<void> {
    const now = new Date();

    const accounts = await this.creditAccountRepo.find({
      where: { validityEnd: LessThan(now) },
      relations: ['user'],
    });

    for (const account of accounts) {
      const user = account.user;
      if (!user || user.status === UserStatus.EXPIRED) continue;

      user.status = UserStatus.EXPIRED;
      await this.userRepo.save(user);
    }

    this.logger.log(`Account locking processed ${accounts.length} expired account(s)`);
  }

  /**
   * Monthly Unblur Reset: On the 1st of every month at 00:05 UTC,
   * delete all unblur records so profiles are re-blurred.
   * Users must re-unblur manually. 0 credits charged for this system action.
   */
  @Cron('0 5 0 1 * *')
  async handleMonthlyUnblurReset(): Promise<void> {
    const result = await this.unlockedInfluencerRepo
      .createQueryBuilder()
      .delete()
      .where('unlock_type = :type', { type: 'UNBLUR' })
      .execute();

    this.logger.log(
      `Monthly unblur reset: removed ${result.affected || 0} unblur records. All profiles are now re-blurred.`,
    );
  }
}
