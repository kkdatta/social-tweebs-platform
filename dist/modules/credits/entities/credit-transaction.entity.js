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
exports.CreditTransaction = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const credit_account_entity_1 = require("./credit-account.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let CreditTransaction = class CreditTransaction {
};
exports.CreditTransaction = CreditTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CreditTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_id', type: 'uuid' }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => credit_account_entity_1.CreditAccount, (account) => account.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", credit_account_entity_1.CreditAccount)
], CreditTransaction.prototype, "creditAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'transaction_type',
        type: 'enum',
        enum: enums_1.TransactionType,
        enumName: 'transaction_type',
    }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "transactionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], CreditTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'module_type',
        type: 'enum',
        enum: enums_1.ModuleType,
        enumName: 'module_type',
        default: enums_1.ModuleType.UNIFIED_BALANCE,
    }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "moduleType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'action_type',
        type: 'enum',
        enum: enums_1.ActionType,
        enumName: 'action_type',
    }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "actionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "sourceUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'source_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CreditTransaction.prototype, "sourceUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_type', length: 100, nullable: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CreditTransaction.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'balance_before',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], CreditTransaction.prototype, "balanceBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'balance_after',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], CreditTransaction.prototype, "balanceAfter", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CreditTransaction.prototype, "createdAt", void 0);
exports.CreditTransaction = CreditTransaction = __decorate([
    (0, typeorm_1.Entity)({ name: 'credit_transactions', schema: 'zorbitads' })
], CreditTransaction);
//# sourceMappingURL=credit-transaction.entity.js.map