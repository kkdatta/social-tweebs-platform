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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const credit_account_entity_1 = require("../../credits/entities/credit-account.entity");
const user_preferences_entity_1 = require("./user-preferences.entity");
let User = class User {
    canLogin() {
        return this.status === enums_1.UserStatus.ACTIVE;
    }
    isAdmin() {
        return this.role === enums_1.UserRole.ADMIN || this.role === enums_1.UserRole.SUPER_ADMIN;
    }
    isSuperAdmin() {
        return this.role === enums_1.UserRole.SUPER_ADMIN;
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 255 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "businessName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.UserRole,
        enumName: 'user_role',
        default: enums_1.UserRole.SUB_USER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.UserStatus,
        enumName: 'user_status',
        default: enums_1.UserStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", User)
], User.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User, (user) => user.parent),
    __metadata("design:type", Array)
], User.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => credit_account_entity_1.CreditAccount, (creditAccount) => creditAccount.user),
    __metadata("design:type", credit_account_entity_1.CreditAccount)
], User.prototype, "creditAccount", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_preferences_entity_1.UserPreferences, (preferences) => preferences.user),
    __metadata("design:type", user_preferences_entity_1.UserPreferences)
], User.prototype, "preferences", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)({ name: 'users', schema: 'zorbitads' })
], User);
//# sourceMappingURL=user.entity.js.map