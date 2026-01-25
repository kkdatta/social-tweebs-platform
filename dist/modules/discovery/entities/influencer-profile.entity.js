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
exports.InfluencerProfile = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const audience_data_entity_1 = require("./audience-data.entity");
let InfluencerProfile = class InfluencerProfile {
    isDataStale() {
        if (!this.dataTtlExpiresAt)
            return true;
        return new Date() > this.dataTtlExpiresAt;
    }
};
exports.InfluencerProfile = InfluencerProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InfluencerProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.PlatformType,
        enumName: 'social_platform',
    }),
    __metadata("design:type", String)
], InfluencerProfile.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', length: 255 }),
    __metadata("design:type", String)
], InfluencerProfile.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "biography", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], InfluencerProfile.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'following_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], InfluencerProfile.prototype, "followingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InfluencerProfile.prototype, "postCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'engagement_rate',
        type: 'decimal',
        precision: 8,
        scale: 4,
        nullable: true,
    }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_likes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], InfluencerProfile.prototype, "avgLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_comments', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], InfluencerProfile.prototype, "avgComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_views', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], InfluencerProfile.prototype, "avgViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_verified', default: false }),
    __metadata("design:type", Boolean)
], InfluencerProfile.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_business_account', default: false }),
    __metadata("design:type", Boolean)
], InfluencerProfile.prototype, "isBusinessAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_type', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "accountType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_country', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "locationCountry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_city', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "locationCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'audience_credibility',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "audienceCredibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_email', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'website_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "websiteUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_modash_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], InfluencerProfile.prototype, "rawModashData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modash_fetched_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], InfluencerProfile.prototype, "modashFetchedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_ttl_expires_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], InfluencerProfile.prototype, "dataTtlExpiresAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => audience_data_entity_1.AudienceData, (audience) => audience.profile),
    __metadata("design:type", Array)
], InfluencerProfile.prototype, "audienceData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InfluencerProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], InfluencerProfile.prototype, "lastUpdatedAt", void 0);
exports.InfluencerProfile = InfluencerProfile = __decorate([
    (0, typeorm_1.Entity)({ name: 'cached_influencer_profiles', schema: 'zorbitads' }),
    (0, typeorm_1.Index)(['platform', 'platformUserId'], { unique: true })
], InfluencerProfile);
//# sourceMappingURL=influencer-profile.entity.js.map