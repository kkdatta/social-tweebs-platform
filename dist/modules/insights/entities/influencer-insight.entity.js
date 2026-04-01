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
exports.InfluencerInsight = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const enums_1 = require("../../../common/enums");
let InfluencerInsight = class InfluencerInsight {
};
exports.InfluencerInsight = InfluencerInsight;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InfluencerInsight.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], InfluencerInsight.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], InfluencerInsight.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "profileId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.PlatformType,
        enumName: 'social_platform',
    }),
    __metadata("design:type", String)
], InfluencerInsight.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InfluencerInsight.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InfluencerInsight.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'following_count', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "followingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_count', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "postCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_likes', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "avgLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_comments', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "avgComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_views', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "avgViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_reel_views', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "avgReelViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_reel_likes', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "avgReelLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_reel_comments', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "avgReelComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_post_er', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "brandPostER", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'posts_with_hidden_likes_pct', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "postsWithHiddenLikesPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_country', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "locationCountry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_city', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "locationCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_verified', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], InfluencerInsight.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "audienceCredibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notable_followers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "notableFollowersPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engager_credibility', type: 'decimal', precision: 5, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "engagerCredibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notable_engagers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "notableEngagersPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audience_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "audienceData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "engagementData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'growth_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "growthData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lookalikes_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "lookalikesData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_affinity_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "brandAffinityData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'interests_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "interestsData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hashtags_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "hashtagsData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recent_posts', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "recentPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recent_reels', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "recentReels", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'popular_reels', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "popularReels", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'popular_posts', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "popularPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_posts', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "sponsoredPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'word_cloud_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "wordCloudData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_used', type: 'decimal', precision: 10, scale: 2, default: 1 }),
    __metadata("design:type", Number)
], InfluencerInsight.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unlocked_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], InfluencerInsight.prototype, "unlockedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_refreshed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], InfluencerInsight.prototype, "lastRefreshedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modash_fetched_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InfluencerInsight.prototype, "modashFetchedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InfluencerInsight.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InfluencerInsight.prototype, "updatedAt", void 0);
exports.InfluencerInsight = InfluencerInsight = __decorate([
    (0, typeorm_1.Entity)({ name: 'influencer_insights', schema: 'zorbitads' }),
    (0, typeorm_1.Unique)(['userId', 'platform', 'platformUserId'])
], InfluencerInsight);
//# sourceMappingURL=influencer-insight.entity.js.map