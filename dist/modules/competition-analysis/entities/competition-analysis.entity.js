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
exports.CompetitionShare = exports.CompetitionPost = exports.CompetitionInfluencer = exports.CompetitionBrand = exports.CompetitionAnalysisReport = exports.PostType = exports.InfluencerCategory = exports.SharePermission = exports.CompetitionReportStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var CompetitionReportStatus;
(function (CompetitionReportStatus) {
    CompetitionReportStatus["PENDING"] = "PENDING";
    CompetitionReportStatus["IN_PROGRESS"] = "IN_PROGRESS";
    CompetitionReportStatus["COMPLETED"] = "COMPLETED";
    CompetitionReportStatus["FAILED"] = "FAILED";
})(CompetitionReportStatus || (exports.CompetitionReportStatus = CompetitionReportStatus = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
var InfluencerCategory;
(function (InfluencerCategory) {
    InfluencerCategory["NANO"] = "NANO";
    InfluencerCategory["MICRO"] = "MICRO";
    InfluencerCategory["MACRO"] = "MACRO";
    InfluencerCategory["MEGA"] = "MEGA";
})(InfluencerCategory || (exports.InfluencerCategory = InfluencerCategory = {}));
var PostType;
(function (PostType) {
    PostType["PHOTO"] = "PHOTO";
    PostType["VIDEO"] = "VIDEO";
    PostType["CAROUSEL"] = "CAROUSEL";
    PostType["REEL"] = "REEL";
})(PostType || (exports.PostType = PostType = {}));
let CompetitionAnalysisReport = class CompetitionAnalysisReport {
};
exports.CompetitionAnalysisReport = CompetitionAnalysisReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompetitionAnalysisReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Untitled Competition Report' }),
    __metadata("design:type", String)
], CompetitionAnalysisReport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], CompetitionAnalysisReport.prototype, "platforms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: CompetitionReportStatus.PENDING }),
    __metadata("design:type", String)
], CompetitionAnalysisReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_start', type: 'date' }),
    __metadata("design:type", Date)
], CompetitionAnalysisReport.prototype, "dateRangeStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_end', type: 'date' }),
    __metadata("design:type", Date)
], CompetitionAnalysisReport.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'auto_refresh_enabled', default: false }),
    __metadata("design:type", Boolean)
], CompetitionAnalysisReport.prototype, "autoRefreshEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_refresh_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], CompetitionAnalysisReport.prototype, "nextRefreshDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_brands', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalBrands", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_influencers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalInfluencers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_posts', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_likes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_views', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_comments', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_shares', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalShares", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_followers', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "totalFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CompetitionAnalysisReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionAnalysisReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], CompetitionAnalysisReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionAnalysisReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], CompetitionAnalysisReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], CompetitionAnalysisReport.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, nullable: true, unique: true }),
    __metadata("design:type", String)
], CompetitionAnalysisReport.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_used', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], CompetitionAnalysisReport.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CompetitionBrand, (brand) => brand.report),
    __metadata("design:type", Array)
], CompetitionAnalysisReport.prototype, "brands", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CompetitionInfluencer, (inf) => inf.report),
    __metadata("design:type", Array)
], CompetitionAnalysisReport.prototype, "influencers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CompetitionPost, (post) => post.report),
    __metadata("design:type", Array)
], CompetitionAnalysisReport.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CompetitionShare, (share) => share.report),
    __metadata("design:type", Array)
], CompetitionAnalysisReport.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CompetitionAnalysisReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CompetitionAnalysisReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CompetitionAnalysisReport.prototype, "completedAt", void 0);
exports.CompetitionAnalysisReport = CompetitionAnalysisReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'competition_analysis_reports', schema: 'zorbitads' })
], CompetitionAnalysisReport);
let CompetitionBrand = class CompetitionBrand {
};
exports.CompetitionBrand = CompetitionBrand;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompetitionBrand.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionBrand.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CompetitionAnalysisReport, (report) => report.brands, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CompetitionAnalysisReport)
], CompetitionBrand.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_name', length: 255 }),
    __metadata("design:type", String)
], CompetitionBrand.prototype, "brandName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CompetitionBrand.prototype, "hashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], CompetitionBrand.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CompetitionBrand.prototype, "keywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, nullable: true }),
    __metadata("design:type", String)
], CompetitionBrand.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_color', length: 20, nullable: true }),
    __metadata("design:type", String)
], CompetitionBrand.prototype, "displayColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "influencerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "postsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_likes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "totalLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_views', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "totalViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_comments', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "totalComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_shares', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "totalShares", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_followers', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "totalFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'photo_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "photoCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'video_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "videoCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'carousel_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "carouselCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reel_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "reelCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nano_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "nanoCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'micro_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "microCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'macro_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "macroCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mega_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "megaCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionBrand.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CompetitionBrand.prototype, "createdAt", void 0);
exports.CompetitionBrand = CompetitionBrand = __decorate([
    (0, typeorm_1.Entity)({ name: 'competition_brands', schema: 'zorbitads' })
], CompetitionBrand);
let CompetitionInfluencer = class CompetitionInfluencer {
};
exports.CompetitionInfluencer = CompetitionInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CompetitionAnalysisReport, (report) => report.influencers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CompetitionAnalysisReport)
], CompetitionInfluencer.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "brandId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CompetitionBrand, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'brand_id' }),
    __metadata("design:type", CompetitionBrand)
], CompetitionInfluencer.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], CompetitionInfluencer.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "audienceCredibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "postsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionInfluencer.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CompetitionInfluencer.prototype, "createdAt", void 0);
exports.CompetitionInfluencer = CompetitionInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'competition_influencers', schema: 'zorbitads' })
], CompetitionInfluencer);
let CompetitionPost = class CompetitionPost {
};
exports.CompetitionPost = CompetitionPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompetitionPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CompetitionAnalysisReport, (report) => report.posts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CompetitionAnalysisReport)
], CompetitionPost.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "brandId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CompetitionBrand, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'brand_id' }),
    __metadata("design:type", CompetitionBrand)
], CompetitionPost.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "influencerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CompetitionInfluencer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'influencer_id' }),
    __metadata("design:type", CompetitionInfluencer)
], CompetitionPost.prototype, "influencer", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "postUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_type', length: 50, nullable: true }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "postType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_hashtags', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CompetitionPost.prototype, "matchedHashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], CompetitionPost.prototype, "matchedUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_keywords', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CompetitionPost.prototype, "matchedKeywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionPost.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionPost.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionPost.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CompetitionPost.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CompetitionPost.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_sponsored', default: false }),
    __metadata("design:type", Boolean)
], CompetitionPost.prototype, "isSponsored", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], CompetitionPost.prototype, "postDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CompetitionPost.prototype, "createdAt", void 0);
exports.CompetitionPost = CompetitionPost = __decorate([
    (0, typeorm_1.Entity)({ name: 'competition_posts', schema: 'zorbitads' })
], CompetitionPost);
let CompetitionShare = class CompetitionShare {
};
exports.CompetitionShare = CompetitionShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompetitionShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionShare.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CompetitionAnalysisReport, (report) => report.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CompetitionAnalysisReport)
], CompetitionShare.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompetitionShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CompetitionShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], CompetitionShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CompetitionShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: SharePermission.VIEW }),
    __metadata("design:type", String)
], CompetitionShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CompetitionShare.prototype, "sharedAt", void 0);
exports.CompetitionShare = CompetitionShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'competition_shares', schema: 'zorbitads' })
], CompetitionShare);
//# sourceMappingURL=competition-analysis.entity.js.map