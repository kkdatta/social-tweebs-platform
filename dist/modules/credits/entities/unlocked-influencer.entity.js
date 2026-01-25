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
exports.UnlockedInfluencer = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
let UnlockedInfluencer = class UnlockedInfluencer {
};
exports.UnlockedInfluencer = UnlockedInfluencer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UnlockedInfluencer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], UnlockedInfluencer.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UnlockedInfluencer.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_id', length: 255 }),
    __metadata("design:type", String)
], UnlockedInfluencer.prototype, "influencerId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.PlatformType,
        enumName: 'platform_type',
    }),
    __metadata("design:type", String)
], UnlockedInfluencer.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unlock_type', length: 50, default: 'UNBLUR' }),
    __metadata("design:type", String)
], UnlockedInfluencer.prototype, "unlockType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'credits_used',
        type: 'decimal',
        precision: 12,
        scale: 2,
    }),
    __metadata("design:type", Number)
], UnlockedInfluencer.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], UnlockedInfluencer.prototype, "createdAt", void 0);
exports.UnlockedInfluencer = UnlockedInfluencer = __decorate([
    (0, typeorm_1.Entity)({ name: 'unlocked_influencers', schema: 'zorbitads' }),
    (0, typeorm_1.Unique)(['userId', 'influencerId', 'platform'])
], UnlockedInfluencer);
//# sourceMappingURL=unlocked-influencer.entity.js.map