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
exports.ModuleBalance = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const credit_account_entity_1 = require("./credit-account.entity");
let ModuleBalance = class ModuleBalance {
};
exports.ModuleBalance = ModuleBalance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ModuleBalance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_id', type: 'uuid' }),
    __metadata("design:type", String)
], ModuleBalance.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => credit_account_entity_1.CreditAccount, (account) => account.moduleBalances),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", credit_account_entity_1.CreditAccount)
], ModuleBalance.prototype, "creditAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'module_type',
        type: 'enum',
        enum: enums_1.ModuleType,
        enumName: 'module_type',
    }),
    __metadata("design:type", String)
], ModuleBalance.prototype, "moduleType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], ModuleBalance.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ModuleBalance.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ModuleBalance.prototype, "updatedAt", void 0);
exports.ModuleBalance = ModuleBalance = __decorate([
    (0, typeorm_1.Entity)({ name: 'module_balances', schema: 'zorbitads' }),
    (0, typeorm_1.Unique)(['accountId', 'moduleType'])
], ModuleBalance);
//# sourceMappingURL=module-balance.entity.js.map