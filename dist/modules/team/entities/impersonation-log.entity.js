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
exports.ImpersonationLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let ImpersonationLog = class ImpersonationLog {
};
exports.ImpersonationLog = ImpersonationLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ImpersonationLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'impersonator_id', type: 'uuid' }),
    __metadata("design:type", String)
], ImpersonationLog.prototype, "impersonatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'impersonator_id' }),
    __metadata("design:type", user_entity_1.User)
], ImpersonationLog.prototype, "impersonator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], ImpersonationLog.prototype, "targetUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'target_user_id' }),
    __metadata("design:type", user_entity_1.User)
], ImpersonationLog.prototype, "targetUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_token_hash', length: 255, unique: true }),
    __metadata("design:type", String)
], ImpersonationLog.prototype, "sessionTokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', length: 45 }),
    __metadata("design:type", String)
], ImpersonationLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ImpersonationLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'started_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ImpersonationLog.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ended_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], ImpersonationLog.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], ImpersonationLog.prototype, "isActive", void 0);
exports.ImpersonationLog = ImpersonationLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'impersonation_logs', schema: 'zorbitads' })
], ImpersonationLog);
//# sourceMappingURL=impersonation-log.entity.js.map