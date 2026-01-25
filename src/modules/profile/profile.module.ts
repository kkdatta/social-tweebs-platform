import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { User, UserPreferences } from '../users/entities';
import { CreditAccount } from '../credits/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserPreferences, CreditAccount]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
