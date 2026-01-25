import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionAnalysisController } from './competition-analysis.controller';
import { CompetitionAnalysisService } from './competition-analysis.service';
import {
  CompetitionAnalysisReport,
  CompetitionBrand,
  CompetitionInfluencer,
  CompetitionPost,
  CompetitionShare,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompetitionAnalysisReport,
      CompetitionBrand,
      CompetitionInfluencer,
      CompetitionPost,
      CompetitionShare,
      User,
    ]),
    CreditsModule,
  ],
  controllers: [CompetitionAnalysisController],
  providers: [CompetitionAnalysisService],
  exports: [CompetitionAnalysisService],
})
export class CompetitionAnalysisModule {}
