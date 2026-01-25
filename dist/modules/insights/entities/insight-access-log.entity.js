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
exports.InsightAccessLog = exports.InsightAccessType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const influencer_insight_entity_1 = require("./influencer-insight.entity");
var InsightAccessType;
(function (InsightAccessType) {
    InsightAccessType["UNLOCK"] = "UNLOCK";
    InsightAccessType["VIEW"] = "VIEW";
    InsightAccessType["REFRESH"] = "REFRESH";
    InsightAccessType["EXPORT"] = "EXPORT";
})(InsightAccessType || (exports.InsightAccessType = InsightAccessType = {}));
let InsightAccessLog = class InsightAccessLog {
};
exports.InsightAccessLog = InsightAccessLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InsightAccessLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'insight_id', type: 'uuid' }),
    __metadata("design:type", String)
], InsightAccessLog.prototype, "insightId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => influencer_insight_entity_1.InfluencerInsight),
    (0, typeorm_1.JoinColumn)({ name: 'insight_id' }),
    __metadata("design:type", influencer_insight_entity_1.InfluencerInsight)
], InsightAccessLog.prototype, "insight", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], InsightAccessLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], InsightAccessLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'access_type', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], InsightAccessLog.prototype, "accessType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credits_deducted', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], InsightAccessLog.prototype, "creditsDeducted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", Object)
], InsightAccessLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InsightAccessLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'accessed_at' }),
    __metadata("design:type", Date)
], InsightAccessLog.prototype, "accessedAt", void 0);
exports.InsightAccessLog = InsightAccessLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'insight_access_log', schema: 'zorbitads' })
], InsightAccessLog);
//# sourceMappingURL=insight-access-log.entity.js.map