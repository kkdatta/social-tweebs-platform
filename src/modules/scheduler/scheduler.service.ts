import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
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
}
