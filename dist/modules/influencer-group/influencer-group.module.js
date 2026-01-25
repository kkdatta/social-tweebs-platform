"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfluencerGroupModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const influencer_group_controller_1 = require("./influencer-group.controller");
const influencer_group_service_1 = require("./influencer-group.service");
const influencer_group_entity_1 = require("./entities/influencer-group.entity");
const user_entity_1 = require("../users/entities/user.entity");
let InfluencerGroupModule = class InfluencerGroupModule {
};
exports.InfluencerGroupModule = InfluencerGroupModule;
exports.InfluencerGroupModule = InfluencerGroupModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                influencer_group_entity_1.InfluencerGroup,
                influencer_group_entity_1.InfluencerGroupMember,
                influencer_group_entity_1.InfluencerGroupShare,
                influencer_group_entity_1.GroupInvitation,
                influencer_group_entity_1.GroupInvitationApplication,
                user_entity_1.User,
            ]),
        ],
        controllers: [influencer_group_controller_1.InfluencerGroupController],
        providers: [influencer_group_service_1.InfluencerGroupService],
        exports: [influencer_group_service_1.InfluencerGroupService],
    })
], InfluencerGroupModule);
//# sourceMappingURL=influencer-group.module.js.map