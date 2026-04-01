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
exports.CollabCheckShare = exports.CollabCheckPost = exports.CollabCheckInfluencer = exports.CollabCheckReport = exports.SharePermission = exports.TimePeriod = exports.CollabReportStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var CollabReportStatus;
(function (CollabReportStatus) {
    CollabReportStatus["PENDING"] = "PENDING";
    CollabReportStatus["PROCESSING"] = "PROCESSING";
    CollabReportStatus["COMPLETED"] = "COMPLETED";
    CollabReportStatus["FAILED"] = "FAILED";
})(CollabReportStatus || (exports.CollabReportStatus = CollabReportStatus = {}));
var TimePeriod;
(function (TimePeriod) {
    TimePeriod["ONE_MONTH"] = "1_MONTH";
    TimePeriod["THREE_MONTHS"] = "3_MONTHS";
    TimePeriod["SIX_MONTHS"] = "6_MONTHS";
    TimePeriod["ONE_YEAR"] = "1_YEAR";
})(TimePeriod || (exports.TimePeriod = TimePeriod = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
let CollabCheckReport = class CollabCheckReport {
};
exports.CollabCheckReport = CollabCheckReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Untitled' }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: CollabReportStatus.PENDING }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'time_period', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "timePeriod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CollabCheckReport.prototype, "queries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_posts', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "totalPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_likes', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "totalLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_views', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "totalViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_comments', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "totalComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_shares', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "totalShares", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_followers', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "totalFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], CollabCheckReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], CollabCheckReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], CollabCheckReport.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, nullable: true, unique: true }),
    __metadata("design:type", String)
], CollabCheckReport.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_used', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], CollabCheckReport.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CollabCheckInfluencer, (inf) => inf.report),
    __metadata("design:type", Array)
], CollabCheckReport.prototype, "influencers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CollabCheckPost, (post) => post.report),
    __metadata("design:type", Array)
], CollabCheckReport.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CollabCheckShare, (share) => share.report),
    __metadata("design:type", Array)
], CollabCheckReport.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CollabCheckReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CollabCheckReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CollabCheckReport.prototype, "completedAt", void 0);
exports.CollabCheckReport = CollabCheckReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'collab_check_reports', schema: 'zorbitads' })
], CollabCheckReport);
let CollabCheckInfluencer = class CollabCheckInfluencer {
};
exports.CollabCheckInfluencer = CollabCheckInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CollabCheckInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CollabCheckInfluencer.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CollabCheckReport, (report) => report.influencers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CollabCheckReport)
], CollabCheckInfluencer.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CollabCheckInfluencer.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], CollabCheckInfluencer.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], CollabCheckInfluencer.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CollabCheckInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CollabCheckInfluencer.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "postsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckInfluencer.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CollabCheckInfluencer.prototype, "createdAt", void 0);
exports.CollabCheckInfluencer = CollabCheckInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'collab_check_influencers', schema: 'zorbitads' })
], CollabCheckInfluencer);
let CollabCheckPost = class CollabCheckPost {
};
exports.CollabCheckPost = CollabCheckPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CollabCheckReport, (report) => report.posts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CollabCheckReport)
], CollabCheckPost.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "influencerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CollabCheckInfluencer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'influencer_id' }),
    __metadata("design:type", CollabCheckInfluencer)
], CollabCheckPost.prototype, "influencer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "postUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_type', length: 50, nullable: true }),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "postType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CollabCheckPost.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_keywords', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CollabCheckPost.prototype, "matchedKeywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckPost.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckPost.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckPost.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CollabCheckPost.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CollabCheckPost.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], CollabCheckPost.prototype, "postDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CollabCheckPost.prototype, "createdAt", void 0);
exports.CollabCheckPost = CollabCheckPost = __decorate([
    (0, typeorm_1.Entity)({ name: 'collab_check_posts', schema: 'zorbitads' })
], CollabCheckPost);
let CollabCheckShare = class CollabCheckShare {
};
exports.CollabCheckShare = CollabCheckShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CollabCheckShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CollabCheckShare.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CollabCheckReport, (report) => report.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CollabCheckReport)
], CollabCheckShare.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CollabCheckShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CollabCheckShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], CollabCheckShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CollabCheckShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: SharePermission.VIEW }),
    __metadata("design:type", String)
], CollabCheckShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CollabCheckShare.prototype, "sharedAt", void 0);
exports.CollabCheckShare = CollabCheckShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'collab_check_shares', schema: 'zorbitads' })
], CollabCheckShare);
//# sourceMappingURL=collab-check.entity.js.map