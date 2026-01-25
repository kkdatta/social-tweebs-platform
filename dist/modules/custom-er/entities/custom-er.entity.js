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
exports.CustomErShare = exports.CustomErPost = exports.CustomErReport = exports.SharePermission = exports.PostType = exports.CustomErReportStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var CustomErReportStatus;
(function (CustomErReportStatus) {
    CustomErReportStatus["PENDING"] = "PENDING";
    CustomErReportStatus["PROCESSING"] = "PROCESSING";
    CustomErReportStatus["COMPLETED"] = "COMPLETED";
    CustomErReportStatus["FAILED"] = "FAILED";
})(CustomErReportStatus || (exports.CustomErReportStatus = CustomErReportStatus = {}));
var PostType;
(function (PostType) {
    PostType["IMAGE"] = "IMAGE";
    PostType["VIDEO"] = "VIDEO";
    PostType["REEL"] = "REEL";
    PostType["CAROUSEL"] = "CAROUSEL";
})(PostType || (exports.PostType = PostType = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
let CustomErReport = class CustomErReport {
};
exports.CustomErReport = CustomErReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomErReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CustomErReport.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], CustomErReport.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], CustomErReport.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomErReport.prototype, "influencerProfileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_avatar_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomErReport.prototype, "influencerAvatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CustomErReport.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_start', type: 'date' }),
    __metadata("design:type", Date)
], CustomErReport.prototype, "dateRangeStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_end', type: 'date' }),
    __metadata("design:type", Date)
], CustomErReport.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: CustomErReportStatus.PENDING }),
    __metadata("design:type", String)
], CustomErReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomErReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'all_posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "allPostsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'all_likes_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "allLikesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'all_views_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "allViewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'all_comments_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "allCommentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'all_shares_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "allSharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'all_avg_engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "allAvgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'all_engagement_views_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "allEngagementViewsRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_posts_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "sponsoredPostsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_likes_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "sponsoredLikesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_views_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "sponsoredViewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_comments_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "sponsoredCommentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_shares_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "sponsoredSharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_avg_engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "sponsoredAvgEngagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sponsored_engagement_views_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CustomErReport.prototype, "sponsoredEngagementViewsRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'has_sponsored_posts', default: false }),
    __metadata("design:type", Boolean)
], CustomErReport.prototype, "hasSponsoredPosts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomErReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], CustomErReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], CustomErReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], CustomErReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], CustomErReport.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, nullable: true, unique: true }),
    __metadata("design:type", String)
], CustomErReport.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CustomErPost, (post) => post.report),
    __metadata("design:type", Array)
], CustomErReport.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CustomErShare, (share) => share.report),
    __metadata("design:type", Array)
], CustomErReport.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CustomErReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CustomErReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CustomErReport.prototype, "completedAt", void 0);
exports.CustomErReport = CustomErReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'custom_er_reports', schema: 'zorbitads' })
], CustomErReport);
let CustomErPost = class CustomErPost {
};
exports.CustomErPost = CustomErPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomErPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomErPost.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CustomErReport, (report) => report.posts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CustomErReport)
], CustomErPost.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], CustomErPost.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomErPost.prototype, "postUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_type', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], CustomErPost.prototype, "postType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomErPost.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomErPost.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CustomErPost.prototype, "hashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], CustomErPost.prototype, "mentions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomErPost.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomErPost.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomErPost.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shares_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomErPost.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CustomErPost.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_sponsored', default: false }),
    __metadata("design:type", Boolean)
], CustomErPost.prototype, "isSponsored", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_date', type: 'date' }),
    __metadata("design:type", Date)
], CustomErPost.prototype, "postDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CustomErPost.prototype, "createdAt", void 0);
exports.CustomErPost = CustomErPost = __decorate([
    (0, typeorm_1.Entity)({ name: 'custom_er_posts', schema: 'zorbitads' })
], CustomErPost);
let CustomErShare = class CustomErShare {
};
exports.CustomErShare = CustomErShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomErShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomErShare.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CustomErReport, (report) => report.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", CustomErReport)
], CustomErShare.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CustomErShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CustomErShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomErShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CustomErShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: SharePermission.VIEW }),
    __metadata("design:type", String)
], CustomErShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CustomErShare.prototype, "sharedAt", void 0);
exports.CustomErShare = CustomErShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'custom_er_shares', schema: 'zorbitads' })
], CustomErShare);
//# sourceMappingURL=custom-er.entity.js.map