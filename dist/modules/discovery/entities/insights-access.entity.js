"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightsAccess = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
const influencer_profile_entity_1 = require("./influencer-profile.entity");
let InsightsAccess = class InsightsAccess {
};
exports.InsightsAccess = InsightsAccess;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InsightsAccess.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], InsightsAccess.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], InsightsAccess.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid' }),
    __metadata("design:type", String)
], InsightsAccess.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => influencer_profile_entity_1.InfluencerProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'influencer_profile_id' }),
    __metadata("design:type", influencer_profile_entity_1.InfluencerProfile)
], InsightsAccess.prototype, "influencerProfile", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.PlatformType,
        enumName: 'social_platform',
    }),
    __metadata("design:type", String)
], InsightsAccess.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', length: 255 }),
    __metadata("design:type", String)
], InsightsAccess.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'credits_used',
        type: 'decimal',
        precision: 10,
        scale: 4,
        default: 1,
    }),
    __metadata("design:type", Number)
], InsightsAccess.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_accessed_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InsightsAccess.prototype, "firstAccessedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_accessed_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InsightsAccess.prototype, "lastAccessedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'access_count', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], InsightsAccess.prototype, "accessCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_refresh_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], InsightsAccess.prototype, "lastRefreshAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refresh_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InsightsAccess.prototype, "refreshCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InsightsAccess.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InsightsAccess.prototype, "lastUpdatedAt", void 0);
exports.InsightsAccess = InsightsAccess = __decorate([
    (0, typeorm_1.Entity)({ name: 'influencer_insights_access', schema: 'zorbitads' }),
    (0, typeorm_1.Index)(['userId', 'influencerProfileId'], { unique: true })
], InsightsAccess);
//# sourceMappingURL=insights-access.entity.js.map