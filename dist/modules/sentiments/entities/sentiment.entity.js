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
exports.SentimentShare = exports.SentimentWordCloud = exports.SentimentEmotion = exports.SentimentPost = exports.SentimentReport = exports.SharePermission = exports.ReportType = exports.SentimentReportStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var SentimentReportStatus;
(function (SentimentReportStatus) {
    SentimentReportStatus["PENDING"] = "PENDING";
    SentimentReportStatus["AGGREGATING"] = "AGGREGATING";
    SentimentReportStatus["IN_PROCESS"] = "IN_PROCESS";
    SentimentReportStatus["COMPLETED"] = "COMPLETED";
    SentimentReportStatus["FAILED"] = "FAILED";
})(SentimentReportStatus || (exports.SentimentReportStatus = SentimentReportStatus = {}));
var ReportType;
(function (ReportType) {
    ReportType["POST"] = "POST";
    ReportType["PROFILE"] = "PROFILE";
})(ReportType || (exports.ReportType = ReportType = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
let SentimentReport = class SentimentReport {
};
exports.SentimentReport = SentimentReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SentimentReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Untitled' }),
    __metadata("design:type", String)
], SentimentReport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_type', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], SentimentReport.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], SentimentReport.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_url', type: 'text' }),
    __metadata("design:type", String)
], SentimentReport.prototype, "targetUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_avatar_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "influencerAvatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: SentimentReportStatus.PENDING }),
    __metadata("design:type", String)
], SentimentReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'overall_sentiment_score', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentReport.prototype, "overallSentimentScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'positive_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentReport.prototype, "positivePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'neutral_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentReport.prototype, "neutralPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'negative_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentReport.prototype, "negativePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deep_brand_analysis', default: false }),
    __metadata("design:type", Boolean)
], SentimentReport.prototype, "deepBrandAnalysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "brandName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "brandUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "productName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], SentimentReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], SentimentReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], SentimentReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], SentimentReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], SentimentReport.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, nullable: true, unique: true }),
    __metadata("design:type", String)
], SentimentReport.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_used', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], SentimentReport.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SentimentPost, (post) => post.report),
    __metadata("design:type", Array)
], SentimentReport.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SentimentEmotion, (emotion) => emotion.report),
    __metadata("design:type", Array)
], SentimentReport.prototype, "emotions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SentimentWordCloud, (word) => word.report),
    __metadata("design:type", Array)
], SentimentReport.prototype, "wordCloud", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SentimentShare, (share) => share.report),
    __metadata("design:type", Array)
], SentimentReport.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SentimentReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SentimentReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SentimentReport.prototype, "completedAt", void 0);
exports.SentimentReport = SentimentReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'sentiment_reports', schema: 'zorbitads' })
], SentimentReport);
let SentimentPost = class SentimentPost {
};
exports.SentimentPost = SentimentPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SentimentPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], SentimentPost.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SentimentReport, (report) => report.posts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", SentimentReport)
], SentimentPost.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], SentimentPost.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SentimentPost.prototype, "postUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SentimentPost.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SentimentPost.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'views_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sentiment_score', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "sentimentScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'positive_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "positivePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'neutral_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "neutralPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'negative_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "negativePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comments_analyzed', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SentimentPost.prototype, "commentsAnalyzed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], SentimentPost.prototype, "postDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SentimentPost.prototype, "createdAt", void 0);
exports.SentimentPost = SentimentPost = __decorate([
    (0, typeorm_1.Entity)({ name: 'sentiment_posts', schema: 'zorbitads' })
], SentimentPost);
let SentimentEmotion = class SentimentEmotion {
};
exports.SentimentEmotion = SentimentEmotion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SentimentEmotion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], SentimentEmotion.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SentimentReport, (report) => report.emotions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", SentimentReport)
], SentimentEmotion.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SentimentEmotion.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SentimentPost, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", SentimentPost)
], SentimentEmotion.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], SentimentEmotion.prototype, "emotion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], SentimentEmotion.prototype, "percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SentimentEmotion.prototype, "count", void 0);
exports.SentimentEmotion = SentimentEmotion = __decorate([
    (0, typeorm_1.Entity)({ name: 'sentiment_emotions', schema: 'zorbitads' })
], SentimentEmotion);
let SentimentWordCloud = class SentimentWordCloud {
};
exports.SentimentWordCloud = SentimentWordCloud;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SentimentWordCloud.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], SentimentWordCloud.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SentimentReport, (report) => report.wordCloud, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", SentimentReport)
], SentimentWordCloud.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SentimentWordCloud.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SentimentPost, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", SentimentPost)
], SentimentWordCloud.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], SentimentWordCloud.prototype, "word", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SentimentWordCloud.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], SentimentWordCloud.prototype, "sentiment", void 0);
exports.SentimentWordCloud = SentimentWordCloud = __decorate([
    (0, typeorm_1.Entity)({ name: 'sentiment_wordcloud', schema: 'zorbitads' })
], SentimentWordCloud);
let SentimentShare = class SentimentShare {
};
exports.SentimentShare = SentimentShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SentimentShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], SentimentShare.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SentimentReport, (report) => report.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", SentimentReport)
], SentimentShare.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SentimentShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], SentimentShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], SentimentShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], SentimentShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: SharePermission.VIEW }),
    __metadata("design:type", String)
], SentimentShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], SentimentShare.prototype, "sharedAt", void 0);
exports.SentimentShare = SentimentShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'sentiment_shares', schema: 'zorbitads' })
], SentimentShare);
//# sourceMappingURL=sentiment.entity.js.map