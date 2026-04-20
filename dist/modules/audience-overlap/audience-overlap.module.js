"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudienceOverlapModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const audience_overlap_controller_1 = require("./audience-overlap.controller");
const audience_overlap_service_1 = require("./audience-overlap.service");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const influencer_profile_entity_1 = require("../discovery/entities/influencer-profile.entity");
const credits_module_1 = require("../credits/credits.module");
const discovery_module_1 = require("../discovery/discovery.module");
let AudienceOverlapModule = class AudienceOverlapModule {
};
exports.AudienceOverlapModule = AudienceOverlapModule;
exports.AudienceOverlapModule = AudienceOverlapModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.AudienceOverlapReport,
                entities_1.AudienceOverlapInfluencer,
                entities_1.AudienceOverlapShare,
                user_entity_1.User,
                influencer_profile_entity_1.InfluencerProfile,
            ]),
            credits_module_1.CreditsModule,
            discovery_module_1.DiscoveryModule,
        ],
        controllers: [audience_overlap_controller_1.AudienceOverlapController],
        providers: [audience_overlap_service_1.AudienceOverlapService],
        exports: [audience_overlap_service_1.AudienceOverlapService],
    })
], AudienceOverlapModule);
//# sourceMappingURL=audience-overlap.module.js.map