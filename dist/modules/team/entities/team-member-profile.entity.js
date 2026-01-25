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
exports.TeamMemberProfile = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
let TeamMemberProfile = class TeamMemberProfile {
    isValid() {
        const now = new Date();
        return now >= this.validityStart && now <= this.validityEnd;
    }
    daysUntilExpiry() {
        const now = new Date();
        const diff = this.validityEnd.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    isExpiringSoon(daysThreshold = 5) {
        const days = this.daysUntilExpiry();
        return days > 0 && days <= daysThreshold;
    }
};
exports.TeamMemberProfile = TeamMemberProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeamMemberProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], TeamMemberProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], TeamMemberProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'internal_role_type',
        type: 'enum',
        enum: enums_1.InternalRoleType,
        enumName: 'internal_role_type',
    }),
    __metadata("design:type", String)
], TeamMemberProfile.prototype, "internalRoleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], TeamMemberProfile.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validity_start', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TeamMemberProfile.prototype, "validityStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validity_end', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TeamMemberProfile.prototype, "validityEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validity_notification_enabled', default: true }),
    __metadata("design:type", Boolean)
], TeamMemberProfile.prototype, "validityNotificationEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], TeamMemberProfile.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], TeamMemberProfile.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TeamMemberProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TeamMemberProfile.prototype, "updatedAt", void 0);
exports.TeamMemberProfile = TeamMemberProfile = __decorate([
    (0, typeorm_1.Entity)({ name: 'team_member_profiles', schema: 'zorbitads' })
], TeamMemberProfile);
//# sourceMappingURL=team-member-profile.entity.js.map