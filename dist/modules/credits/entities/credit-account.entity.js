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
exports.CreditAccount = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const module_balance_entity_1 = require("./module-balance.entity");
const credit_transaction_entity_1 = require("./credit-transaction.entity");
let CreditAccount = class CreditAccount {
    isActive() {
        const now = new Date();
        return (!this.isLocked &&
            now >= this.validityStart &&
            now <= this.validityEnd);
    }
    isExpiringSoon(daysThreshold = 7) {
        const now = new Date();
        const threshold = new Date(this.validityEnd);
        threshold.setDate(threshold.getDate() - daysThreshold);
        return now >= threshold && now <= this.validityEnd;
    }
    daysRemaining() {
        const now = new Date();
        const diff = this.validityEnd.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
};
exports.CreditAccount = CreditAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CreditAccount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], CreditAccount.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.creditAccount),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CreditAccount.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'unified_balance',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], CreditAccount.prototype, "unifiedBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validity_start', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CreditAccount.prototype, "validityStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validity_end', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CreditAccount.prototype, "validityEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_locked', default: false }),
    __metadata("design:type", Boolean)
], CreditAccount.prototype, "isLocked", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => module_balance_entity_1.ModuleBalance, (moduleBalance) => moduleBalance.creditAccount),
    __metadata("design:type", Array)
], CreditAccount.prototype, "moduleBalances", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => credit_transaction_entity_1.CreditTransaction, (transaction) => transaction.creditAccount),
    __metadata("design:type", Array)
], CreditAccount.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CreditAccount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CreditAccount.prototype, "updatedAt", void 0);
exports.CreditAccount = CreditAccount = __decorate([
    (0, typeorm_1.Entity)({ name: 'credit_accounts', schema: 'zorbitads' })
], CreditAccount);
//# sourceMappingURL=credit-account.entity.js.map