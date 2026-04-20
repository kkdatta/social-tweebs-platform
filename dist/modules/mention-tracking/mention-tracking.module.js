"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionTrackingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mention_tracking_controller_1 = require("./mention-tracking.controller");
const mention_tracking_service_1 = require("./mention-tracking.service");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_module_1 = require("../credits/credits.module");
const discovery_module_1 = require("../discovery/discovery.module");
let MentionTrackingModule = class MentionTrackingModule {
};
exports.MentionTrackingModule = MentionTrackingModule;
exports.MentionTrackingModule = MentionTrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.MentionTrackingReport,
                entities_1.MentionTrackingInfluencer,
                entities_1.MentionTrackingPost,
                entities_1.MentionTrackingShare,
                user_entity_1.User,
            ]),
            credits_module_1.CreditsModule,
            discovery_module_1.DiscoveryModule,
        ],
        controllers: [mention_tracking_controller_1.MentionTrackingController],
        providers: [mention_tracking_service_1.MentionTrackingService],
        exports: [mention_tracking_service_1.MentionTrackingService],
    })
], MentionTrackingModule);
//# sourceMappingURL=mention-tracking.module.js.map