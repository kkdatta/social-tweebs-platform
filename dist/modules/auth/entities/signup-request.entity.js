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
exports.SignupRequest = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
let SignupRequest = class SignupRequest {
    isPending() {
        return this.status === enums_1.SignupRequestStatus.PENDING;
    }
};
exports.SignupRequest = SignupRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SignupRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, unique: true }),
    __metadata("design:type", String)
], SignupRequest.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], SignupRequest.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], SignupRequest.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_name', length: 255 }),
    __metadata("design:type", String)
], SignupRequest.prototype, "businessName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'campaign_frequency',
        type: 'enum',
        enum: enums_1.CampaignFrequency,
        enumName: 'campaign_frequency',
    }),
    __metadata("design:type", String)
], SignupRequest.prototype, "campaignFrequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SignupRequest.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', length: 255 }),
    __metadata("design:type", String)
], SignupRequest.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.SignupRequestStatus,
        enumName: 'signup_request_status',
        default: enums_1.SignupRequestStatus.PENDING,
    }),
    __metadata("design:type", String)
], SignupRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SignupRequest.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SignupRequest.prototype, "processedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'processed_by' }),
    __metadata("design:type", user_entity_1.User)
], SignupRequest.prototype, "processedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rejection_reason', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SignupRequest.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SignupRequest.prototype, "createdAt", void 0);
exports.SignupRequest = SignupRequest = __decorate([
    (0, typeorm_1.Entity)({ name: 'signup_requests', schema: 'zorbitads' })
], SignupRequest);
//# sourceMappingURL=signup-request.entity.js.map