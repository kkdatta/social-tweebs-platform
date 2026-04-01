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
exports.PaidCollabShare = exports.PaidCollabCategorization = exports.PaidCollabPost = exports.PaidCollabInfluencer = exports.PaidCollabReport = exports.SharePermission = exports.QueryLogic = exports.InfluencerCategory = exports.PaidCollabReportStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var PaidCollabReportStatus;
(function (PaidCollabReportStatus) {
    PaidCollabReportStatus["PENDING"] = "PENDING";
    PaidCollabReportStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PaidCollabReportStatus["COMPLETED"] = "COMPLETED";
    PaidCollabReportStatus["FAILED"] = "FAILED";
})(PaidCollabReportStatus || (exports.PaidCollabReportStatus = PaidCollabReportStatus = {}));
var InfluencerCategory;
(function (InfluencerCategory) {
    InfluencerCategory["ALL"] = "ALL";
    InfluencerCategory["NANO"] = "NANO";
    InfluencerCategory["MICRO"] = "MICRO";
    InfluencerCategory["MACRO"] = "MACRO";
    InfluencerCategory["MEGA"] = "MEGA";
})(InfluencerCategory || (exports.InfluencerCategory = InfluencerCategory = {}));
var QueryLogic;
(function (QueryLogic) {
    QueryLogic["AND"] = "AND";
    QueryLogic["OR"] = "OR";
})(QueryLogic || (exports.QueryLogic = QueryLogic = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
let PaidCollabReport = class PaidCollabReport {
};
exports.PaidCollabReport = PaidCollabReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Untitled Report' }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: PaidCollabReportStatus.PENDING }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], PaidCollabReport.prototype, "hashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], PaidCollabReport.prototype, "mentions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'query_logic', type: 'varchar', length: 10, default: QueryLogic.OR }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "queryLogic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_start', type: 'date' }),
    __metadata("design:type", Date)
], PaidCollabReport.prototype, "dateRangeStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_end', type: 'date' }),
    __metadata("design:type", Date)
], PaidCollabReport.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_influencers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "totalInfluencers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_posts', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "totalPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_likes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "totalLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_views', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "totalViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_comments', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "totalComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_shares', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "totalShares", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_views_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "engagementViewsRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], PaidCollabReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], PaidCollabReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], PaidCollabReport.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, nullable: true, unique: true }),
    __metadata("design:type", String)
], PaidCollabReport.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_used', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], PaidCollabReport.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PaidCollabInfluencer, (inf) => inf.report),
    __metadata("design:type", Array)
], PaidCollabReport.prototype, "influencers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PaidCollabPost, (post) => post.report),
    __metadata("design:type", Array)
], PaidCollabReport.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PaidCollabShare, (share) => share.report),
    __metadata("design:type", Array)
], PaidCollabReport.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PaidCollabCategorization, (cat) => cat.report),
    __metadata("design:type", Array)
], PaidCollabReport.prototype, "categorizations", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaidCollabReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PaidCollabReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PaidCollabReport.prototype, "completedAt", void 0);
exports.PaidCollabReport = PaidCollabReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'paid_collab_reports', schema: 'zorbitads' })
], PaidCollabReport);
let PaidCollabInfluencer = class PaidCollabInfluencer {
};
exports.PaidCollabInfluencer = PaidCollabInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PaidCollabReport, (report) => report.influencers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", PaidCollabReport)
], PaidCollabInfluencer.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "postsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category', type: 'varchar', length: 20, default: InfluencerCategory.ALL }),
    __metadata("design:type", String)
], PaidCollabInfluencer.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credibility_score', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "credibilityScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabInfluencer.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaidCollabInfluencer.prototype, "createdAt", void 0);
exports.PaidCollabInfluencer = PaidCollabInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'paid_collab_influencers', schema: 'zorbitads' })
], PaidCollabInfluencer);
let PaidCollabPost = class PaidCollabPost {
};
exports.PaidCollabPost = PaidCollabPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PaidCollabReport, (report) => report.posts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", PaidCollabReport)
], PaidCollabPost.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "influencerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PaidCollabInfluencer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'influencer_id' }),
    __metadata("design:type", PaidCollabInfluencer)
], PaidCollabPost.prototype, "influencer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "postUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_type', length: 50, nullable: true }),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "postType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaidCollabPost.prototype, "caption", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_hashtags', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], PaidCollabPost.prototype, "matchedHashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_mentions', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], PaidCollabPost.prototype, "matchedMentions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_sponsored', default: false }),
    __metadata("design:type", Boolean)
], PaidCollabPost.prototype, "isSponsored", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabPost.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabPost.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabPost.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabPost.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PaidCollabPost.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PaidCollabPost.prototype, "postDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaidCollabPost.prototype, "createdAt", void 0);
exports.PaidCollabPost = PaidCollabPost = __decorate([
    (0, typeorm_1.Entity)({ name: 'paid_collab_posts', schema: 'zorbitads' })
], PaidCollabPost);
let PaidCollabCategorization = class PaidCollabCategorization {
};
exports.PaidCollabCategorization = PaidCollabCategorization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaidCollabCategorization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollabCategorization.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PaidCollabReport, (report) => report.categorizations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", PaidCollabReport)
], PaidCollabCategorization.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], PaidCollabCategorization.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accounts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "accountsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'followers_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "followersCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "postsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PaidCollabCategorization.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaidCollabCategorization.prototype, "createdAt", void 0);
exports.PaidCollabCategorization = PaidCollabCategorization = __decorate([
    (0, typeorm_1.Entity)({ name: 'paid_collab_categorizations', schema: 'zorbitads' })
], PaidCollabCategorization);
let PaidCollabShare = class PaidCollabShare {
};
exports.PaidCollabShare = PaidCollabShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaidCollabShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollabShare.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PaidCollabReport, (report) => report.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", PaidCollabReport)
], PaidCollabShare.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PaidCollabShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], PaidCollabShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollabShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], PaidCollabShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: SharePermission.VIEW }),
    __metadata("design:type", String)
], PaidCollabShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PaidCollabShare.prototype, "sharedAt", void 0);
exports.PaidCollabShare = PaidCollabShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'paid_collab_shares', schema: 'zorbitads' })
], PaidCollabShare);
//# sourceMappingURL=paid-collaboration.entity.js.map