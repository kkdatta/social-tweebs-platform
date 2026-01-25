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
exports.ModashApiLog = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
let ModashApiLog = class ModashApiLog {
};
exports.ModashApiLog = ModashApiLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ModashApiLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ModashApiLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ModashApiLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], ModashApiLog.prototype, "endpoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'http_method', length: 10 }),
    __metadata("design:type", String)
], ModashApiLog.prototype, "httpMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.PlatformType,
        enumName: 'social_platform',
        nullable: true,
    }),
    __metadata("design:type", String)
], ModashApiLog.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_payload', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ModashApiLog.prototype, "requestPayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'response_status_code', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ModashApiLog.prototype, "responseStatusCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'response_time_ms', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ModashApiLog.prototype, "responseTimeMs", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'modash_credits_consumed',
        type: 'decimal',
        precision: 10,
        scale: 4,
        nullable: true,
    }),
    __metadata("design:type", Number)
], ModashApiLog.prototype, "modashCreditsConsumed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'platform_credits_charged',
        type: 'decimal',
        precision: 10,
        scale: 4,
        nullable: true,
    }),
    __metadata("design:type", Number)
], ModashApiLog.prototype, "platformCreditsCharged", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ModashApiLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ModashApiLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ModashApiLog.prototype, "lastUpdatedAt", void 0);
exports.ModashApiLog = ModashApiLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'modash_api_logs', schema: 'zorbitads' })
], ModashApiLog);
//# sourceMappingURL=modash-api-log.entity.js.map