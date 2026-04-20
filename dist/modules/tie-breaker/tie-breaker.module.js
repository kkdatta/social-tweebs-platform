"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TieBreakerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tie_breaker_controller_1 = require("./tie-breaker.controller");
const tie_breaker_service_1 = require("./tie-breaker.service");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const influencer_profile_entity_1 = require("../discovery/entities/influencer-profile.entity");
const unlocked_influencer_entity_1 = require("../credits/entities/unlocked-influencer.entity");
const credits_module_1 = require("../credits/credits.module");
const discovery_module_1 = require("../discovery/discovery.module");
let TieBreakerModule = class TieBreakerModule {
};
exports.TieBreakerModule = TieBreakerModule;
exports.TieBreakerModule = TieBreakerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.TieBreakerComparison,
                entities_1.TieBreakerInfluencer,
                entities_1.TieBreakerShare,
                user_entity_1.User,
                influencer_profile_entity_1.InfluencerProfile,
                unlocked_influencer_entity_1.UnlockedInfluencer,
            ]),
            credits_module_1.CreditsModule,
            discovery_module_1.DiscoveryModule,
        ],
        controllers: [tie_breaker_controller_1.TieBreakerController],
        providers: [tie_breaker_service_1.TieBreakerService],
        exports: [tie_breaker_service_1.TieBreakerService],
    })
], TieBreakerModule);
//# sourceMappingURL=tie-breaker.module.js.map