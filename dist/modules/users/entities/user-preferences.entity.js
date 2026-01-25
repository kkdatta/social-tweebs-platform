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
exports.UserPreferences = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserPreferences = class UserPreferences {
};
exports.UserPreferences = UserPreferences;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserPreferences.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], UserPreferences.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.preferences),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserPreferences.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_discovery_export', default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "notifyDiscoveryExport", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_collab_export', default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "notifyCollabExport", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_overlap_report', default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "notifyOverlapReport", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_content_discovery', default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "notifyContentDiscovery", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_group_import', default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "notifyGroupImport", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_campaign_import', default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "notifyCampaignImport", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notify_report_shared', default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "notifyReportShared", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], UserPreferences.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], UserPreferences.prototype, "updatedAt", void 0);
exports.UserPreferences = UserPreferences = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_preferences', schema: 'zorbitads' })
], UserPreferences);
//# sourceMappingURL=user-preferences.entity.js.map