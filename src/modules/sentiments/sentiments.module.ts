import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentimentsController } from './sentiments.controller';
import { SentimentsService } from './sentiments.service';
import {
  SentimentReport,
  SentimentPost,
  SentimentEmotion,
  SentimentWordCloud,
  SentimentShare,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SentimentReport,
      SentimentPost,
      SentimentEmotion,
      SentimentWordCloud,
      SentimentShare,
      User,
    ]),
    CreditsModule,
    DiscoveryModule,
  ],
  controllers: [SentimentsController],
  providers: [SentimentsService],
  exports: [SentimentsService],
})
export class SentimentsModule {}
