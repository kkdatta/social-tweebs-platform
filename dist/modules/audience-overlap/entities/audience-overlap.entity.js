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
exports.AudienceOverlapShare = exports.AudienceOverlapInfluencer = exports.AudienceOverlapReport = exports.OverlapSharePermission = exports.OverlapReportStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var OverlapReportStatus;
(function (OverlapReportStatus) {
    OverlapReportStatus["PENDING"] = "PENDING";
    OverlapReportStatus["IN_PROCESS"] = "IN_PROCESS";
    OverlapReportStatus["COMPLETED"] = "COMPLETED";
    OverlapReportStatus["FAILED"] = "FAILED";
})(OverlapReportStatus || (exports.OverlapReportStatus = OverlapReportStatus = {}));
var OverlapSharePermission;
(function (OverlapSharePermission) {
    OverlapSharePermission["VIEW"] = "VIEW";
    OverlapSharePermission["EDIT"] = "EDIT";
})(OverlapSharePermission || (exports.OverlapSharePermission = OverlapSharePermission = {}));
let AudienceOverlapReport = class AudienceOverlapReport {
};
exports.AudienceOverlapReport = AudienceOverlapReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Untitled' }),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: OverlapReportStatus.PENDING }),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_followers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapReport.prototype, "totalFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_followers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapReport.prototype, "uniqueFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'overlapping_followers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapReport.prototype, "overlappingFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'overlap_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AudienceOverlapReport.prototype, "overlapPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AudienceOverlapReport.prototype, "uniquePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], AudienceOverlapReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], AudienceOverlapReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], AudienceOverlapReport.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, nullable: true, unique: true }),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AudienceOverlapInfluencer, (inf) => inf.report),
    __metadata("design:type", Array)
], AudienceOverlapReport.prototype, "influencers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AudienceOverlapShare, (share) => share.report),
    __metadata("design:type", Array)
], AudienceOverlapReport.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AudienceOverlapReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AudienceOverlapReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AudienceOverlapReport.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AudienceOverlapReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapReport.prototype, "retryCount", void 0);
exports.AudienceOverlapReport = AudienceOverlapReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'audience_overlap_reports', schema: 'zorbitads' })
], AudienceOverlapReport);
let AudienceOverlapInfluencer = class AudienceOverlapInfluencer {
};
exports.AudienceOverlapInfluencer = AudienceOverlapInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AudienceOverlapInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], AudienceOverlapInfluencer.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AudienceOverlapReport, (report) => report.influencers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", AudienceOverlapReport)
], AudienceOverlapInfluencer.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AudienceOverlapInfluencer.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], AudienceOverlapInfluencer.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], AudienceOverlapInfluencer.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AudienceOverlapInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AudienceOverlapInfluencer.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapInfluencer.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_followers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapInfluencer.prototype, "uniqueFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AudienceOverlapInfluencer.prototype, "uniquePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'overlapping_followers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapInfluencer.prototype, "overlappingFollowers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'overlapping_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AudienceOverlapInfluencer.prototype, "overlappingPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AudienceOverlapInfluencer.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AudienceOverlapInfluencer.prototype, "createdAt", void 0);
exports.AudienceOverlapInfluencer = AudienceOverlapInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'audience_overlap_influencers', schema: 'zorbitads' })
], AudienceOverlapInfluencer);
let AudienceOverlapShare = class AudienceOverlapShare {
};
exports.AudienceOverlapShare = AudienceOverlapShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AudienceOverlapShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', type: 'uuid' }),
    __metadata("design:type", String)
], AudienceOverlapShare.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AudienceOverlapReport, (report) => report.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", AudienceOverlapReport)
], AudienceOverlapShare.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AudienceOverlapShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], AudienceOverlapShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], AudienceOverlapShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], AudienceOverlapShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_level', type: 'varchar', length: 50, default: OverlapSharePermission.VIEW }),
    __metadata("design:type", String)
], AudienceOverlapShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AudienceOverlapShare.prototype, "sharedAt", void 0);
exports.AudienceOverlapShare = AudienceOverlapShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'audience_overlap_shares', schema: 'zorbitads' })
], AudienceOverlapShare);
//# sourceMappingURL=audience-overlap.entity.js.map