import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TieBreakerController } from './tie-breaker.controller';
import { TieBreakerService } from './tie-breaker.service';
import {
  TieBreakerComparison,
  TieBreakerInfluencer,
  TieBreakerShare,
} from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { UnlockedInfluencer } from '../credits/entities/unlocked-influencer.entity';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TieBreakerComparison,
      TieBreakerInfluencer,
      TieBreakerShare,
      User,
      InfluencerProfile,
      UnlockedInfluencer,
    ]),
    CreditsModule,
  ],
  controllers: [TieBreakerController],
  providers: [TieBreakerService],
  exports: [TieBreakerService],
})
export class TieBreakerModule {}
