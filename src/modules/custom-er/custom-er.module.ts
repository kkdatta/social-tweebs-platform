import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomErController } from './custom-er.controller';
import { CustomErService } from './custom-er.service';
import { CustomErReport, CustomErPost, CustomErShare } from './entities';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomErReport,
      CustomErPost,
      CustomErShare,
      User,
    ]),
  ],
  controllers: [CustomErController],
  providers: [CustomErService],
  exports: [CustomErService],
})
export class CustomErModule {}
