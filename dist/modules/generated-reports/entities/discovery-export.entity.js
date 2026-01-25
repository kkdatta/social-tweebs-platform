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
exports.DiscoveryExport = exports.ExportStatus = exports.ExportFormat = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["CSV"] = "CSV";
    ExportFormat["XLSX"] = "XLSX";
    ExportFormat["JSON"] = "JSON";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var ExportStatus;
(function (ExportStatus) {
    ExportStatus["PENDING"] = "PENDING";
    ExportStatus["PROCESSING"] = "PROCESSING";
    ExportStatus["COMPLETED"] = "COMPLETED";
    ExportStatus["FAILED"] = "FAILED";
})(ExportStatus || (exports.ExportStatus = ExportStatus = {}));
let DiscoveryExport = class DiscoveryExport {
};
exports.DiscoveryExport = DiscoveryExport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Discovery Export' }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'export_format',
        type: 'varchar',
        length: 20,
        default: ExportFormat.CSV,
    }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "exportFormat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DiscoveryExport.prototype, "profileCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size_bytes', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], DiscoveryExport.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'search_filters', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DiscoveryExport.prototype, "searchFilters", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exported_profile_ids', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], DiscoveryExport.prototype, "exportedProfileIds", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: ExportStatus.COMPLETED,
    }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], DiscoveryExport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], DiscoveryExport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], DiscoveryExport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'credits_used',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], DiscoveryExport.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DiscoveryExport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DiscoveryExport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'downloaded_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], DiscoveryExport.prototype, "downloadedAt", void 0);
exports.DiscoveryExport = DiscoveryExport = __decorate([
    (0, typeorm_1.Entity)({ name: 'discovery_exports', schema: 'zorbitads' })
], DiscoveryExport);
//# sourceMappingURL=discovery-export.entity.js.map