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
exports.SystemConfig = void 0;
const typeorm_1 = require("typeorm");
let SystemConfig = class SystemConfig {
};
exports.SystemConfig = SystemConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SystemConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'config_key', type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], SystemConfig.prototype, "configKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'config_value', type: 'text' }),
    __metadata("design:type", String)
], SystemConfig.prototype, "configValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_type', type: 'varchar', length: 20, default: 'string' }),
    __metadata("design:type", String)
], SystemConfig.prototype, "dataType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SystemConfig.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SystemConfig.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SystemConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SystemConfig.prototype, "updatedAt", void 0);
exports.SystemConfig = SystemConfig = __decorate([
    (0, typeorm_1.Entity)({ name: 'system_config', schema: 'zorbitads' })
], SystemConfig);
//# sourceMappingURL=system-config.entity.js.map