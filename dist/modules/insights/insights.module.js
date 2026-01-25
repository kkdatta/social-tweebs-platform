"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const insights_controller_1 = require("./insights.controller");
const insights_service_1 = require("./insights.service");
const entities_1 = require("./entities");
const influencer_profile_entity_1 = require("../discovery/entities/influencer-profile.entity");
const credits_module_1 = require("../credits/credits.module");
const discovery_module_1 = require("../discovery/discovery.module");
let InsightsModule = class InsightsModule {
};
exports.InsightsModule = InsightsModule;
exports.InsightsModule = InsightsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.InfluencerInsight,
                entities_1.SystemConfig,
                entities_1.InsightAccessLog,
                influencer_profile_entity_1.InfluencerProfile,
            ]),
            credits_module_1.CreditsModule,
            discovery_module_1.DiscoveryModule,
        ],
        controllers: [insights_controller_1.InsightsController],
        providers: [insights_service_1.InsightsService],
        exports: [insights_service_1.InsightsService],
    })
], InsightsModule);
//# sourceMappingURL=insights.module.js.map