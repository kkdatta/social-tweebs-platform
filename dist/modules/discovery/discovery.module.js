"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const discovery_controller_1 = require("./discovery.controller");
const discovery_service_1 = require("./services/discovery.service");
const modash_service_1 = require("./services/modash.service");
const modash_raw_service_1 = require("./services/modash-raw.service");
const entities_1 = require("./entities");
const credits_module_1 = require("../credits/credits.module");
const insights_module_1 = require("../insights/insights.module");
const user_entity_1 = require("../users/entities/user.entity");
const unlocked_influencer_entity_1 = require("../credits/entities/unlocked-influencer.entity");
let DiscoveryModule = class DiscoveryModule {
};
exports.DiscoveryModule = DiscoveryModule;
exports.DiscoveryModule = DiscoveryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.InfluencerProfile,
                entities_1.AudienceData,
                entities_1.DiscoverySearch,
                entities_1.SearchResult,
                entities_1.InsightsAccess,
                entities_1.ModashApiLog,
                entities_1.ExportRecord,
                user_entity_1.User,
                unlocked_influencer_entity_1.UnlockedInfluencer,
            ]),
            credits_module_1.CreditsModule,
            (0, common_1.forwardRef)(() => insights_module_1.InsightsModule),
        ],
        controllers: [discovery_controller_1.DiscoveryController],
        providers: [discovery_service_1.DiscoveryService, modash_service_1.ModashService, modash_raw_service_1.ModashRawService],
        exports: [discovery_service_1.DiscoveryService, modash_service_1.ModashService, modash_raw_service_1.ModashRawService],
    })
], DiscoveryModule);
//# sourceMappingURL=discovery.module.js.map