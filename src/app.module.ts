import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CreditsModule } from './modules/credits/credits.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TeamModule } from './modules/team/team.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { InsightsModule } from './modules/insights/insights.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ContentModule } from './modules/content/content.module';
import { AudienceOverlapModule } from './modules/audience-overlap/audience-overlap.module';
import { CustomErModule } from './modules/custom-er/custom-er.module';
import { SentimentsModule } from './modules/sentiments/sentiments.module';
import { CollabCheckModule } from './modules/collab-check/collab-check.module';
import { GeneratedReportsModule } from './modules/generated-reports/generated-reports.module';
import { TieBreakerModule } from './modules/tie-breaker/tie-breaker.module';
import { PaidCollaborationModule } from './modules/paid-collaboration/paid-collaboration.module';
import { InfluencerGroupModule } from './modules/influencer-group/influencer-group.module';
import { MentionTrackingModule } from './modules/mention-tracking/mention-tracking.module';
import { CompetitionAnalysisModule } from './modules/competition-analysis/competition-analysis.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import modashConfig from './config/modash.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig, modashConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        schema: configService.get('database.schema'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.throttle.ttl') || 60000,
            limit: configService.get<number>('app.throttle.limit') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    CreditsModule,
    ProfileModule,
    TeamModule,
    DiscoveryModule,
    InsightsModule,
    CampaignsModule,
    ContentModule,
    AudienceOverlapModule,
    CustomErModule,
    SentimentsModule,
    CollabCheckModule,
    GeneratedReportsModule,
    TieBreakerModule,
    PaidCollaborationModule,
    InfluencerGroupModule,
    MentionTrackingModule,
    CompetitionAnalysisModule,
  ],
})
export class AppModule {}
