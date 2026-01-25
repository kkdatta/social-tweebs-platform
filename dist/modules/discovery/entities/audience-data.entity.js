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
exports.AudienceData = exports.AudienceDataType = void 0;
const typeorm_1 = require("typeorm");
const influencer_profile_entity_1 = require("./influencer-profile.entity");
var AudienceDataType;
(function (AudienceDataType) {
    AudienceDataType["GENDER"] = "GENDER";
    AudienceDataType["AGE"] = "AGE";
    AudienceDataType["LOCATION_COUNTRY"] = "LOCATION_COUNTRY";
    AudienceDataType["LOCATION_CITY"] = "LOCATION_CITY";
    AudienceDataType["INTEREST"] = "INTEREST";
    AudienceDataType["BRAND_AFFINITY"] = "BRAND_AFFINITY";
    AudienceDataType["LANGUAGE"] = "LANGUAGE";
    AudienceDataType["REACHABILITY"] = "REACHABILITY";
    AudienceDataType["CREDIBILITY"] = "CREDIBILITY";
})(AudienceDataType || (exports.AudienceDataType = AudienceDataType = {}));
let AudienceData = class AudienceData {
};
exports.AudienceData = AudienceData;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AudienceData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_id', type: 'uuid' }),
    __metadata("design:type", String)
], AudienceData.prototype, "profileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => influencer_profile_entity_1.InfluencerProfile, (profile) => profile.audienceData, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'profile_id' }),
    __metadata("design:type", influencer_profile_entity_1.InfluencerProfile)
], AudienceData.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'data_type',
        type: 'enum',
        enum: AudienceDataType,
        enumName: 'audience_data_type',
    }),
    __metadata("design:type", String)
], AudienceData.prototype, "dataType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_key', length: 100 }),
    __metadata("design:type", String)
], AudienceData.prototype, "categoryKey", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 8,
        scale: 4,
        nullable: true,
    }),
    __metadata("design:type", Number)
], AudienceData.prototype, "percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'affinity_score',
        type: 'decimal',
        precision: 8,
        scale: 4,
        nullable: true,
    }),
    __metadata("design:type", Number)
], AudienceData.prototype, "affinityScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AudienceData.prototype, "rawData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], AudienceData.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], AudienceData.prototype, "lastUpdatedAt", void 0);
exports.AudienceData = AudienceData = __decorate([
    (0, typeorm_1.Entity)({ name: 'influencer_audience_data', schema: 'zorbitads' })
], AudienceData);
//# sourceMappingURL=audience-data.entity.js.map