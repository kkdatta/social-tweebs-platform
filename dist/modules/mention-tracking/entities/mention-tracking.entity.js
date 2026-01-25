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
exports.MentionTrackingShare = exports.MentionTrackingPost = exports.MentionTrackingInfluencer = exports.MentionTrackingReport = exports.InfluencerCategory = exports.SharePermission = exports.MentionReportStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var MentionReportStatus;
(function (MentionReportStatus) {
    MentionReportStatus["PENDING"] = "PENDING";
    MentionReportStatus["PROCESSING"] = "PROCESSING";
    MentionReportStatus["COMPLETED"] = "COMPLETED";
    MentionReportStatus["FAILED"] = "FAILED";
})(MentionReportStatus || (exports.MentionReportStatus = MentionReportStatus = {}));
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
let MentionTrackingReport = class MentionTrackingReport {
};
exports.MentionTrackingReport = MentionTrackingReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MentionTrackingReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Untitled' }),
    __metadata("design:type", String)
], MentionTrackingReport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], MentionTrackingReport.prototype, "platforms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: MentionReportStatus.PENDING }),
    __metadata("design:type", String)
], MentionTrackingReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_start', type: 'date' }),
    __metadata("design:type", Date)
], MentionTrackingReport.prototype, "dateRangeStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_end', type: 'date' }),
    __metadata("design:type", Date)
], MentionTrackingReport.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], MentionTrackingReport.prototype, "hashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], MentionTrackingReport.prototype, "usernames", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], MentionTrackingReport.prototype, "keywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_only', default: false }),
    __metadata("design:type", Boolean)
], MentionTrackingReport.prototype, "sponsoredOnly", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'auto_refresh_enabled', default: false }),
    __metadata("design:type", Boolean)
], MentionTrackingReport.prototype, "autoRefreshEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_refresh_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], MentionTrackingReport.prototype, "nextRefreshDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_influencers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "totalInfluencers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_posts', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "totalPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_likes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "totalLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_views', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "totalViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_comments', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "totalComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_shares', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "totalShares", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_views_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "engagementViewsRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_followers', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "totalFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], MentionTrackingReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], MentionTrackingReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], MentionTrackingReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], MentionTrackingReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], MentionTrackingReport.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, nullable: true, unique: true }),
    __metadata("design:type", String)
], MentionTrackingReport.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_used', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], MentionTrackingReport.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MentionTrackingInfluencer, (inf) => inf.report),
    __metadata("design:type", Array)
], MentionTrackingReport.prototype, "influencers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MentionTrackingPost, (post) => post.report),
    __metadata("design:type", Array)
], MentionTrackingReport.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MentionTrackingShare, (share) => share.report),
    __metadata("design:type", Array)
], MentionTrackingReport.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MentionTrackingReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MentionTrackingReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MentionTrackingReport.prototype, "completedAt", void 0);
exports.MentionTrackingReport = MentionTrackingReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'mention_tracking_reports', schema: 'zorbitads' })
], MentionTrackingReport);
let MentionTrackingInfluencer = class MentionTrackingInfluencer {
};
exports.MentionTrackingInfluencer = MentionTrackingInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MentionTrackingReport, (report) => report.influencers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", MentionTrackingReport)
], MentionTrackingInfluencer.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], MentionTrackingInfluencer.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "audienceCredibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "postsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingInfluencer.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MentionTrackingInfluencer.prototype, "createdAt", void 0);
exports.MentionTrackingInfluencer = MentionTrackingInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'mention_tracking_influencers', schema: 'zorbitads' })
], MentionTrackingInfluencer);
let MentionTrackingPost = class MentionTrackingPost {
};
exports.MentionTrackingPost = MentionTrackingPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MentionTrackingReport, (report) => report.posts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", MentionTrackingReport)
], MentionTrackingPost.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "influencerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MentionTrackingInfluencer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'influencer_id' }),
    __metadata("design:type", MentionTrackingInfluencer)
], MentionTrackingPost.prototype, "influencer", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "postUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_type', length: 50, nullable: true }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "postType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingPost.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_hashtags', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], MentionTrackingPost.prototype, "matchedHashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_usernames', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], MentionTrackingPost.prototype, "matchedUsernames", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_keywords', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], MentionTrackingPost.prototype, "matchedKeywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingPost.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingPost.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingPost.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MentionTrackingPost.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], MentionTrackingPost.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_sponsored', default: false }),
    __metadata("design:type", Boolean)
], MentionTrackingPost.prototype, "isSponsored", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], MentionTrackingPost.prototype, "postDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MentionTrackingPost.prototype, "createdAt", void 0);
exports.MentionTrackingPost = MentionTrackingPost = __decorate([
    (0, typeorm_1.Entity)({ name: 'mention_tracking_posts', schema: 'zorbitads' })
], MentionTrackingPost);
let MentionTrackingShare = class MentionTrackingShare {
};
exports.MentionTrackingShare = MentionTrackingShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MentionTrackingShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], MentionTrackingShare.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MentionTrackingReport, (report) => report.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", MentionTrackingReport)
], MentionTrackingShare.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], MentionTrackingShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], MentionTrackingShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], MentionTrackingShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], MentionTrackingShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: SharePermission.VIEW }),
    __metadata("design:type", String)
], MentionTrackingShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], MentionTrackingShare.prototype, "sharedAt", void 0);
exports.MentionTrackingShare = MentionTrackingShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'mention_tracking_shares', schema: 'zorbitads' })
], MentionTrackingShare);
//# sourceMappingURL=mention-tracking.entity.js.map