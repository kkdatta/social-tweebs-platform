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
exports.ActionPermission = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
let ActionPermission = class ActionPermission {
};
exports.ActionPermission = ActionPermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ActionPermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], ActionPermission.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ActionPermission.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'action_name',
        type: 'enum',
        enum: enums_1.ActionName,
        enumName: 'action_name',
    }),
    __metadata("design:type", String)
], ActionPermission.prototype, "actionName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_enabled', default: false }),
    __metadata("design:type", Boolean)
], ActionPermission.prototype, "isEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'granted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ActionPermission.prototype, "grantedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'granted_by' }),
    __metadata("design:type", user_entity_1.User)
], ActionPermission.prototype, "grantor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'granted_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ActionPermission.prototype, "grantedAt", void 0);
exports.ActionPermission = ActionPermission = __decorate([
    (0, typeorm_1.Entity)({ name: 'action_permissions', schema: 'zorbitads' }),
    (0, typeorm_1.Unique)(['userId', 'actionName'])
], ActionPermission);
//# sourceMappingURL=action-permission.entity.js.map