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
exports.CampaignShare = exports.SharePermission = exports.CampaignMetric = exports.CampaignDeliverable = exports.DeliverableStatus = exports.DeliverableType = exports.CampaignInfluencer = exports.ContractStatus = exports.PaymentStatus = exports.InfluencerStatus = exports.Campaign = exports.CampaignObjective = exports.CampaignStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "DRAFT";
    CampaignStatus["ACTIVE"] = "ACTIVE";
    CampaignStatus["PAUSED"] = "PAUSED";
    CampaignStatus["COMPLETED"] = "COMPLETED";
    CampaignStatus["CANCELLED"] = "CANCELLED";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
var CampaignObjective;
(function (CampaignObjective) {
    CampaignObjective["BRAND_AWARENESS"] = "BRAND_AWARENESS";
    CampaignObjective["ENGAGEMENT"] = "ENGAGEMENT";
    CampaignObjective["CONVERSIONS"] = "CONVERSIONS";
    CampaignObjective["REACH"] = "REACH";
    CampaignObjective["TRAFFIC"] = "TRAFFIC";
    CampaignObjective["SALES"] = "SALES";
})(CampaignObjective || (exports.CampaignObjective = CampaignObjective = {}));
let Campaign = class Campaign {
};
exports.Campaign = Campaign;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Campaign.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Campaign.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Campaign.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: CampaignStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Campaign.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "objective", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Campaign.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Campaign.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Campaign.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'INR' }),
    __metadata("design:type", String)
], Campaign.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], Campaign.prototype, "hashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], Campaign.prototype, "mentions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_audience', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Campaign.prototype, "targetAudience", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], Campaign.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], Campaign.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], Campaign.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Campaign.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Campaign.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Campaign.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CampaignInfluencer, (influencer) => influencer.campaign),
    __metadata("design:type", Array)
], Campaign.prototype, "influencers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CampaignDeliverable, (deliverable) => deliverable.campaign),
    __metadata("design:type", Array)
], Campaign.prototype, "deliverables", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CampaignShare, (share) => share.campaign),
    __metadata("design:type", Array)
], Campaign.prototype, "shares", void 0);
exports.Campaign = Campaign = __decorate([
    (0, typeorm_1.Entity)({ name: 'campaigns', schema: 'zorbitads' })
], Campaign);
var InfluencerStatus;
(function (InfluencerStatus) {
    InfluencerStatus["INVITED"] = "INVITED";
    InfluencerStatus["CONFIRMED"] = "CONFIRMED";
    InfluencerStatus["DECLINED"] = "DECLINED";
    InfluencerStatus["ACTIVE"] = "ACTIVE";
    InfluencerStatus["COMPLETED"] = "COMPLETED";
})(InfluencerStatus || (exports.InfluencerStatus = InfluencerStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PARTIAL"] = "PARTIAL";
    PaymentStatus["PAID"] = "PAID";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["PENDING"] = "PENDING";
    ContractStatus["SENT"] = "SENT";
    ContractStatus["SIGNED"] = "SIGNED";
    ContractStatus["REJECTED"] = "REJECTED";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
let CampaignInfluencer = class CampaignInfluencer {
};
exports.CampaignInfluencer = CampaignInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id', type: 'uuid' }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Campaign, (campaign) => campaign.influencers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", Campaign)
], CampaignInfluencer.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_name', length: 255 }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "influencerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_username', length: 255, nullable: true }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "influencerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follower_count', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], CampaignInfluencer.prototype, "followerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: InfluencerStatus.INVITED,
    }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'budget_allocated', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CampaignInfluencer.prototype, "budgetAllocated", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_status',
        type: 'varchar',
        length: 50,
        default: PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_amount', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CampaignInfluencer.prototype, "paymentAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'contract_status',
        type: 'varchar',
        length: 50,
        default: ContractStatus.PENDING,
    }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "contractStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CampaignInfluencer.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'added_at' }),
    __metadata("design:type", Date)
], CampaignInfluencer.prototype, "addedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CampaignInfluencer.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CampaignInfluencer.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CampaignDeliverable, (deliverable) => deliverable.campaignInfluencer),
    __metadata("design:type", Array)
], CampaignInfluencer.prototype, "deliverables", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CampaignMetric, (metric) => metric.campaignInfluencer),
    __metadata("design:type", Array)
], CampaignInfluencer.prototype, "metrics", void 0);
exports.CampaignInfluencer = CampaignInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'campaign_influencers', schema: 'zorbitads' })
], CampaignInfluencer);
var DeliverableType;
(function (DeliverableType) {
    DeliverableType["POST"] = "POST";
    DeliverableType["STORY"] = "STORY";
    DeliverableType["REEL"] = "REEL";
    DeliverableType["VIDEO"] = "VIDEO";
    DeliverableType["CAROUSEL"] = "CAROUSEL";
    DeliverableType["TWEET"] = "TWEET";
    DeliverableType["THREAD"] = "THREAD";
})(DeliverableType || (exports.DeliverableType = DeliverableType = {}));
var DeliverableStatus;
(function (DeliverableStatus) {
    DeliverableStatus["PENDING"] = "PENDING";
    DeliverableStatus["IN_PROGRESS"] = "IN_PROGRESS";
    DeliverableStatus["SUBMITTED"] = "SUBMITTED";
    DeliverableStatus["APPROVED"] = "APPROVED";
    DeliverableStatus["REJECTED"] = "REJECTED";
    DeliverableStatus["PUBLISHED"] = "PUBLISHED";
})(DeliverableStatus || (exports.DeliverableStatus = DeliverableStatus = {}));
let CampaignDeliverable = class CampaignDeliverable {
};
exports.CampaignDeliverable = CampaignDeliverable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id', type: 'uuid' }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Campaign, (campaign) => campaign.deliverables, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", Campaign)
], CampaignDeliverable.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_influencer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "campaignInfluencerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CampaignInfluencer, (influencer) => influencer.deliverables, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_influencer_id' }),
    __metadata("design:type", CampaignInfluencer)
], CampaignDeliverable.prototype, "campaignInfluencer", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'deliverable_type',
        type: 'varchar',
        length: 50,
    }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "deliverableType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], CampaignDeliverable.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: DeliverableStatus.PENDING,
    }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "contentUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], CampaignDeliverable.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submitted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CampaignDeliverable.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CampaignDeliverable.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'published_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CampaignDeliverable.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CampaignDeliverable.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CampaignMetric, (metric) => metric.deliverable),
    __metadata("design:type", Array)
], CampaignDeliverable.prototype, "metrics", void 0);
exports.CampaignDeliverable = CampaignDeliverable = __decorate([
    (0, typeorm_1.Entity)({ name: 'campaign_deliverables', schema: 'zorbitads' })
], CampaignDeliverable);
let CampaignMetric = class CampaignMetric {
};
exports.CampaignMetric = CampaignMetric;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignMetric.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id', type: 'uuid' }),
    __metadata("design:type", String)
], CampaignMetric.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Campaign, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", Campaign)
], CampaignMetric.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deliverable_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CampaignMetric.prototype, "deliverableId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CampaignDeliverable, (deliverable) => deliverable.metrics, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'deliverable_id' }),
    __metadata("design:type", CampaignDeliverable)
], CampaignMetric.prototype, "deliverable", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_influencer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CampaignMetric.prototype, "campaignInfluencerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CampaignInfluencer, (influencer) => influencer.metrics, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_influencer_id' }),
    __metadata("design:type", CampaignInfluencer)
], CampaignMetric.prototype, "campaignInfluencer", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'recorded_at' }),
    __metadata("design:type", Date)
], CampaignMetric.prototype, "recordedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "impressions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "reach", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "likes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "saves", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "views", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "clicks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engagement_rate', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "engagementRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost_per_engagement', type: 'decimal', precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "costPerEngagement", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost_per_click', type: 'decimal', precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "costPerClick", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost_per_impression', type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Number)
], CampaignMetric.prototype, "costPerImpression", void 0);
exports.CampaignMetric = CampaignMetric = __decorate([
    (0, typeorm_1.Entity)({ name: 'campaign_metrics', schema: 'zorbitads' })
], CampaignMetric);
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
    SharePermission["ADMIN"] = "ADMIN";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
let CampaignShare = class CampaignShare {
};
exports.CampaignShare = CampaignShare;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignShare.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id', type: 'uuid' }),
    __metadata("design:type", String)
], CampaignShare.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Campaign, (campaign) => campaign.shares, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", Campaign)
], CampaignShare.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_with_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CampaignShare.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_with_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CampaignShare.prototype, "sharedWithUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shared_by_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], CampaignShare.prototype, "sharedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'shared_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CampaignShare.prototype, "sharedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'permission_level',
        type: 'varchar',
        length: 50,
        default: SharePermission.VIEW,
    }),
    __metadata("design:type", String)
], CampaignShare.prototype, "permissionLevel", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'shared_at' }),
    __metadata("design:type", Date)
], CampaignShare.prototype, "sharedAt", void 0);
exports.CampaignShare = CampaignShare = __decorate([
    (0, typeorm_1.Entity)({ name: 'campaign_shares', schema: 'zorbitads' })
], CampaignShare);
//# sourceMappingURL=campaign.entity.js.map