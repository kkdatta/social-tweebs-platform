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
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AudienceOverlapReport,
      AudienceOverlapInfluencer,
      AudienceOverlapShare,
      User,
    ]),
    CreditsModule,
  ],
  controllers: [AudienceOverlapController],
  providers: [AudienceOverlapService],
  exports: [AudienceOverlapService],
})
export class AudienceOverlapModule {}
