"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const credits_module_1 = require("./modules/credits/credits.module");
const profile_module_1 = require("./modules/profile/profile.module");
const team_module_1 = require("./modules/team/team.module");
const discovery_module_1 = require("./modules/discovery/discovery.module");
const insights_module_1 = require("./modules/insights/insights.module");
const campaigns_module_1 = require("./modules/campaigns/campaigns.module");
const content_module_1 = require("./modules/content/content.module");
const audience_overlap_module_1 = require("./modules/audience-overlap/audience-overlap.module");
const custom_er_module_1 = require("./modules/custom-er/custom-er.module");
const sentiments_module_1 = require("./modules/sentiments/sentiments.module");
const collab_check_module_1 = require("./modules/collab-check/collab-check.module");
const generated_reports_module_1 = require("./modules/generated-reports/generated-reports.module");
const tie_breaker_module_1 = require("./modules/tie-breaker/tie-breaker.module");
const paid_collaboration_module_1 = require("./modules/paid-collaboration/paid-collaboration.module");
const influencer_group_module_1 = require("./modules/influencer-group/influencer-group.module");
const mention_tracking_module_1 = require("./modules/mention-tracking/mention-tracking.module");
const competition_analysis_module_1 = require("./modules/competition-analysis/competition-analysis.module");
const scheduler_module_1 = require("./modules/scheduler/scheduler.module");
const mail_module_1 = require("./common/services/mail.module");
const schedule_1 = require("@nestjs/schedule");
const database_config_1 = require("./config/database.config");
const jwt_config_1 = require("./config/jwt.config");
const app_config_1 = require("./config/app.config");
const modash_config_1 = require("./config/modash.config");
const mail_config_1 = require("./config/mail.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, jwt_config_1.default, app_config_1.default, modash_config_1.default, mail_config_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
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
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            ttl: configService.get('app.throttle.ttl') || 60000,
                            limit: configService.get('app.throttle.limit') || 100,
                        },
                    ],
                }),
                inject: [config_1.ConfigService],
            }),
            mail_module_1.MailModule,
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            credits_module_1.CreditsModule,
            profile_module_1.ProfileModule,
            team_module_1.TeamModule,
            discovery_module_1.DiscoveryModule,
            insights_module_1.InsightsModule,
            campaigns_module_1.CampaignsModule,
            content_module_1.ContentModule,
            audience_overlap_module_1.AudienceOverlapModule,
            custom_er_module_1.CustomErModule,
            sentiments_module_1.SentimentsModule,
            collab_check_module_1.CollabCheckModule,
            generated_reports_module_1.GeneratedReportsModule,
            tie_breaker_module_1.TieBreakerModule,
            paid_collaboration_module_1.PaidCollaborationModule,
            influencer_group_module_1.InfluencerGroupModule,
            mention_tracking_module_1.MentionTrackingModule,
            competition_analysis_module_1.CompetitionAnalysisModule,
            scheduler_module_1.SchedulerModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map