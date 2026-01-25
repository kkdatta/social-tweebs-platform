"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const team_service_1 = require("./team.service");
const team_controller_1 = require("./team.controller");
const entities_1 = require("./entities");
const entities_2 = require("../users/entities");
const entities_3 = require("../credits/entities");
let TeamModule = class TeamModule {
};
exports.TeamModule = TeamModule;
exports.TeamModule = TeamModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_2.User,
                entities_2.UserPreferences,
                entities_1.TeamMemberProfile,
                entities_1.FeatureAccess,
                entities_1.ActionPermission,
                entities_1.ImpersonationLog,
                entities_3.CreditAccount,
                entities_3.CreditTransaction,
            ]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('jwt.secret'),
                    signOptions: {
                        expiresIn: configService.get('jwt.accessExpiration'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [team_controller_1.TeamController],
        providers: [team_service_1.TeamService],
        exports: [team_service_1.TeamService],
    })
], TeamModule);
//# sourceMappingURL=team.module.js.map