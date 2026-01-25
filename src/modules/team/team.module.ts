import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import {
  TeamMemberProfile,
  FeatureAccess,
  ActionPermission,
  ImpersonationLog,
} from './entities';
import { User, UserPreferences } from '../users/entities';
import { CreditAccount, CreditTransaction } from '../credits/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserPreferences,
      TeamMemberProfile,
      FeatureAccess,
      ActionPermission,
      ImpersonationLog,
      CreditAccount,
      CreditTransaction,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiration'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
