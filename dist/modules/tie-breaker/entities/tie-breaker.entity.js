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
exports.TieBreakerShare = exports.TieBreakerInfluencer = exports.TieBreakerComparison = exports.TieBreakerSharePermission = exports.TieBreakerPlatform = exports.TieBreakerStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var TieBreakerStatus;
(function (TieBreakerStatus) {
    TieBreakerStatus["PENDING"] = "PENDING";
    TieBreakerStatus["PROCESSING"] = "PROCESSING";
    TieBreakerStatus["COMPLETED"] = "COMPLETED";
    TieBreakerStatus["FAILED"] = "FAILED";
})(TieBreakerStatus || (exports.TieBreakerStatus = TieBreakerStatus = {}));
var TieBreakerPlatform;
(function (TieBreakerPlatform) {
    TieBreakerPlatform["INSTAGRAM"] = "INSTAGRAM";
    TieBreakerPlatform["YOUTUBE"] = "YOUTUBE";
    TieBreakerPlatform["TIKTOK"] = "TIKTOK";
})(TieBreakerPlatform || (exports.TieBreakerPlatform = TieBreakerPlatform = {}));
var TieBreakerSharePermission;
(function (TieBreakerSharePermission) {
    TieBreakerSharePermission["VIEW"] = "VIEW";
    TieBreakerSharePermission["EDIT"] = "EDIT";
})(TieBreakerSharePermission || (exports.TieBreakerSharePermission = TieBreakerSharePermission = {}));
let TieBreakerComparison = class TieBreakerComparison {
};
exports.TieBreakerComparison = TieBreakerComparison;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Influencer Comparison' }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: TieBreakerStatus.PENDING }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'search_query', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "searchQuery", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], TieBreakerComparison.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], TieBreakerComparison.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TieBreakerComparison.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', type: 'varchar', length: 100, unique: true, nullable: true }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_used', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TieBreakerComparison.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TieBreakerComparison.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TieBreakerComparison.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TieBreakerComparison.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TieBreakerComparison.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TieBreakerInfluencer, (inf) => inf.comparison),
    __metadata("design:type", Array)
], TieBreakerComparison.prototype, "influencers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TieBreakerShare, (share) => share.comparison),
    __metadata("design:type", Array)
], TieBreakerComparison.prototype, "shares", void 0);
exports.TieBreakerComparison = TieBreakerComparison = __decorate([
    (0, typeorm_1.Entity)({ name: 'tie_breaker_comparisons', schema: 'zorbitads' })
], TieBreakerComparison);
let TieBreakerInfluencer = class TieBreakerInfluencer {
};
exports.TieBreakerInfluencer = TieBreakerInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comparison_id', type: 'uuid' }),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "comparisonId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TieBreakerComparison, (comp) => comp.influencers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'comparison_id' }),
    __metadata("design:type", TieBreakerComparison)
], TieBreakerInfluencer.prototype, "comparison", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TieBreakerInfluencer.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'following_count', type: 'bigint', default: 0, nullable: true }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "followingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_likes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "avgLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_views', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "avgViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_comments', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "avgComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_reel_views', type: 'bigint', default: 0, nullable: true }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "avgReelViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_verified', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TieBreakerInfluencer.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audience_quality', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "audienceQuality", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notable_followers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "notableFollowersPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'followers_gender_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TieBreakerInfluencer.prototype, "followersGenderData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'followers_age_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "followersAgeData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'followers_countries', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "followersCountries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'followers_cities', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "followersCities", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'followers_interests', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "followersInterests", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagers_quality', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "engagersQuality", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notable_engagers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "notableEngagersPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagers_gender_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TieBreakerInfluencer.prototype, "engagersGenderData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagers_age_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "engagersAgeData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagers_countries', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "engagersCountries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagers_cities', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "engagersCities", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagers_interests', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "engagersInterests", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'top_posts', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], TieBreakerInfluencer.prototype, "topPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TieBreakerInfluencer.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'was_unlocked', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TieBreakerInfluencer.prototype, "wasUnlocked", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TieBreakerInfluencer.prototype, "createdAt", void 0);
exports.TieBreakerInfluencer = TieBreakerInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'tie_breaker_influencers', schema: 'zorbitads' })
], TieBreakerInfluencer);
let TieBreakerShare = class TieBreakerShare {
};
exports.TieBreakerShare = TieBreakerShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TieBreakerShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comparison_id', type: 'uuid' }),
    __metadata("design:type", String)
], TieBreakerShare.prototype, "comparisonId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TieBreakerComparison, (comp) => comp.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'comparison_id' }),
    __metadata("design:type", TieBreakerComparison)
], TieBreakerShare.prototype, "comparison", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TieBreakerShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], TieBreakerShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], TieBreakerShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], TieBreakerShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: TieBreakerSharePermission.VIEW }),
    __metadata("design:type", String)
], TieBreakerShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'shared_at' }),
    __metadata("design:type", Date)
], TieBreakerShare.prototype, "sharedAt", void 0);
exports.TieBreakerShare = TieBreakerShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'tie_breaker_shares', schema: 'zorbitads' })
], TieBreakerShare);
//# sourceMappingURL=tie-breaker.entity.js.map