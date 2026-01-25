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
exports.GroupInvitationApplication = exports.GroupInvitation = exports.InfluencerGroupShare = exports.InfluencerGroupMember = exports.InfluencerGroup = exports.CurrencyType = exports.ApplicationStatus = exports.InvitationType = exports.SharePermission = exports.GroupPlatform = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var GroupPlatform;
(function (GroupPlatform) {
    GroupPlatform["INSTAGRAM"] = "INSTAGRAM";
    GroupPlatform["YOUTUBE"] = "YOUTUBE";
    GroupPlatform["TIKTOK"] = "TIKTOK";
})(GroupPlatform || (exports.GroupPlatform = GroupPlatform = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
    SharePermission["ADMIN"] = "ADMIN";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
var InvitationType;
(function (InvitationType) {
    InvitationType["LANDING_PAGE"] = "LANDING_PAGE";
    InvitationType["FORM_ONLY"] = "FORM_ONLY";
})(InvitationType || (exports.InvitationType = InvitationType = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["PENDING"] = "PENDING";
    ApplicationStatus["APPROVED"] = "APPROVED";
    ApplicationStatus["REJECTED"] = "REJECTED";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
var CurrencyType;
(function (CurrencyType) {
    CurrencyType["INR"] = "INR";
    CurrencyType["USD"] = "USD";
    CurrencyType["RM"] = "RM";
    CurrencyType["SGD"] = "SGD";
    CurrencyType["AED"] = "AED";
    CurrencyType["VND"] = "VND";
})(CurrencyType || (exports.CurrencyType = CurrencyType = {}));
let InfluencerGroup = class InfluencerGroup {
};
exports.InfluencerGroup = InfluencerGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InfluencerGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], InfluencerGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfluencerGroup.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], InfluencerGroup.prototype, "platforms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_count', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], InfluencerGroup.prototype, "influencerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unapproved_count', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], InfluencerGroup.prototype, "unapprovedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], InfluencerGroup.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], InfluencerGroup.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], InfluencerGroup.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], InfluencerGroup.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: false }),
    __metadata("design:type", Boolean)
], InfluencerGroup.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_url_token', length: 100, unique: true, nullable: true }),
    __metadata("design:type", String)
], InfluencerGroup.prototype, "shareUrlToken", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InfluencerGroup.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InfluencerGroup.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InfluencerGroupMember, (member) => member.group),
    __metadata("design:type", Array)
], InfluencerGroup.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InfluencerGroupShare, (share) => share.group),
    __metadata("design:type", Array)
], InfluencerGroup.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GroupInvitation, (invitation) => invitation.group),
    __metadata("design:type", Array)
], InfluencerGroup.prototype, "invitations", void 0);
exports.InfluencerGroup = InfluencerGroup = __decorate([
    (0, typeorm_1.Entity)({ name: 'influencer_groups', schema: 'zorbitads' })
], InfluencerGroup);
let InfluencerGroupMember = class InfluencerGroupMember {
};
exports.InfluencerGroupMember = InfluencerGroupMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', type: 'uuid' }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InfluencerGroup, (group) => group.members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", InfluencerGroup)
], InfluencerGroupMember.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_user_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "platformUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], InfluencerGroupMember.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], InfluencerGroupMember.prototype, "audienceCredibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], InfluencerGroupMember.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_likes', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], InfluencerGroupMember.prototype, "avgLikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_views', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], InfluencerGroupMember.prototype, "avgViews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'added_by', type: 'uuid' }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "addedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'added_by' }),
    __metadata("design:type", user_entity_1.User)
], InfluencerGroupMember.prototype, "addedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source', length: 50, default: 'MANUAL' }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_group_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "sourceGroupId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'application_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], InfluencerGroupMember.prototype, "applicationId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'added_at' }),
    __metadata("design:type", Date)
], InfluencerGroupMember.prototype, "addedAt", void 0);
exports.InfluencerGroupMember = InfluencerGroupMember = __decorate([
    (0, typeorm_1.Entity)({ name: 'influencer_group_members', schema: 'zorbitads' })
], InfluencerGroupMember);
let InfluencerGroupShare = class InfluencerGroupShare {
};
exports.InfluencerGroupShare = InfluencerGroupShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InfluencerGroupShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', type: 'uuid' }),
    __metadata("design:type", String)
], InfluencerGroupShare.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InfluencerGroup, (group) => group.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", InfluencerGroup)
], InfluencerGroupShare.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], InfluencerGroupShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], InfluencerGroupShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], InfluencerGroupShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], InfluencerGroupShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'permission_level',
        type: 'varchar',
        length: 50,
        default: SharePermission.VIEW,
    }),
    __metadata("design:type", String)
], InfluencerGroupShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'shared_at' }),
    __metadata("design:type", Date)
], InfluencerGroupShare.prototype, "sharedAt", void 0);
exports.InfluencerGroupShare = InfluencerGroupShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'influencer_group_shares', schema: 'zorbitads' })
], InfluencerGroupShare);
let GroupInvitation = class GroupInvitation {
};
exports.GroupInvitation = GroupInvitation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GroupInvitation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', type: 'uuid' }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InfluencerGroup, (group) => group.invitations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", InfluencerGroup)
], GroupInvitation.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invitation_name', length: 255 }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "invitationName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invitation_type', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "invitationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_slug', length: 100, unique: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "urlSlug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], GroupInvitation.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'landing_header', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "landingHeader", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'landing_content', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "landingContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'landing_button_text', length: 100, nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "landingButtonText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'landing_images', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], GroupInvitation.prototype, "landingImages", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'landing_video_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "landingVideoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'form_header', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "formHeader", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'form_content', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "formContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'form_platforms', type: 'text', array: true, default: '{}' }),
    __metadata("design:type", Array)
], GroupInvitation.prototype, "formPlatforms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'collect_phone', default: false }),
    __metadata("design:type", Boolean)
], GroupInvitation.prototype, "collectPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'collect_email', default: false }),
    __metadata("design:type", Boolean)
], GroupInvitation.prototype, "collectEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'collect_address', default: false }),
    __metadata("design:type", Boolean)
], GroupInvitation.prototype, "collectAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pricing_options', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], GroupInvitation.prototype, "pricingOptions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pricing_currency', type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "pricingCurrency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'form_button_text', length: 100, nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "formButtonText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thankyou_header', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "thankyouHeader", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thankyou_content', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "thankyouContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'background_color', length: 20, default: '#ffffff' }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "backgroundColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'title_color', length: 20, default: '#000000' }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "titleColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'text_color', length: 20, default: '#333333' }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "textColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'button_bg_color', length: 20, default: '#6366f1' }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "buttonBgColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'button_text_color', length: 20, default: '#ffffff' }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "buttonTextColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_on_submission', default: true }),
    __metadata("design:type", Boolean)
], GroupInvitation.prototype, "notifyOnSubmission", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], GroupInvitation.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], GroupInvitation.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'applications_count', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], GroupInvitation.prototype, "applicationsCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], GroupInvitation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], GroupInvitation.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GroupInvitationApplication, (app) => app.invitation),
    __metadata("design:type", Array)
], GroupInvitation.prototype, "applications", void 0);
exports.GroupInvitation = GroupInvitation = __decorate([
    (0, typeorm_1.Entity)({ name: 'group_invitations', schema: 'zorbitads' })
], GroupInvitation);
let GroupInvitationApplication = class GroupInvitationApplication {
};
exports.GroupInvitationApplication = GroupInvitationApplication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invitation_id', type: 'uuid' }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "invitationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GroupInvitation, (invitation) => invitation.applications, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'invitation_id' }),
    __metadata("design:type", GroupInvitation)
], GroupInvitationApplication.prototype, "invitation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', type: 'uuid' }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_username', length: 255 }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "platformUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'platform_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "platformUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], GroupInvitationApplication.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_number', length: 50, nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'photo_price', type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GroupInvitationApplication.prototype, "photoPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'video_price', type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GroupInvitationApplication.prototype, "videoPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'story_price', type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GroupInvitationApplication.prototype, "storyPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'carousel_price', type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GroupInvitationApplication.prototype, "carouselPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pricing_currency', type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "pricingCurrency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: ApplicationStatus.PENDING,
    }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "approvedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'approved_by' }),
    __metadata("design:type", user_entity_1.User)
], GroupInvitationApplication.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], GroupInvitationApplication.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rejection_reason', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'additional_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], GroupInvitationApplication.prototype, "additionalData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', length: 50, nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GroupInvitationApplication.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'submitted_at' }),
    __metadata("design:type", Date)
], GroupInvitationApplication.prototype, "submittedAt", void 0);
exports.GroupInvitationApplication = GroupInvitationApplication = __decorate([
    (0, typeorm_1.Entity)({ name: 'group_invitation_applications', schema: 'zorbitads' })
], GroupInvitationApplication);
//# sourceMappingURL=influencer-group.entity.js.map