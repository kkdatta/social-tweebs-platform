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
exports.PaidCollaborationReport = exports.PaidReportStatus = exports.PaidReportFormat = exports.PaidReportType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var PaidReportType;
(function (PaidReportType) {
    PaidReportType["COLLABORATION"] = "COLLABORATION";
    PaidReportType["COMPARISON"] = "COMPARISON";
    PaidReportType["ANALYSIS"] = "ANALYSIS";
})(PaidReportType || (exports.PaidReportType = PaidReportType = {}));
var PaidReportFormat;
(function (PaidReportFormat) {
    PaidReportFormat["PDF"] = "PDF";
    PaidReportFormat["XLSX"] = "XLSX";
})(PaidReportFormat || (exports.PaidReportFormat = PaidReportFormat = {}));
var PaidReportStatus;
(function (PaidReportStatus) {
    PaidReportStatus["PENDING"] = "PENDING";
    PaidReportStatus["PROCESSING"] = "PROCESSING";
    PaidReportStatus["COMPLETED"] = "COMPLETED";
    PaidReportStatus["FAILED"] = "FAILED";
})(PaidReportStatus || (exports.PaidReportStatus = PaidReportStatus = {}));
let PaidCollaborationReport = class PaidCollaborationReport {
};
exports.PaidCollaborationReport = PaidCollaborationReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: 'Paid Collaboration Report' }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'report_type',
        type: 'varchar',
        length: 50,
        default: PaidReportType.COLLABORATION,
    }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'export_format',
        type: 'varchar',
        length: 20,
        default: PaidReportFormat.PDF,
    }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "exportFormat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PaidCollaborationReport.prototype, "influencerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_ids', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], PaidCollaborationReport.prototype, "influencerIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PaidCollaborationReport.prototype, "influencerData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_content', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PaidCollaborationReport.prototype, "reportContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size_bytes', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], PaidCollaborationReport.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_start', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PaidCollaborationReport.prototype, "dateRangeStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_range_end', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PaidCollaborationReport.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: PaidReportStatus.COMPLETED,
    }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], PaidCollaborationReport.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], PaidCollaborationReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], PaidCollaborationReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'credits_used',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], PaidCollaborationReport.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaidCollaborationReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PaidCollaborationReport.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'downloaded_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PaidCollaborationReport.prototype, "downloadedAt", void 0);
exports.PaidCollaborationReport = PaidCollaborationReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'paid_collaboration_reports', schema: 'zorbitads' })
], PaidCollaborationReport);
//# sourceMappingURL=paid-collaboration-report.entity.js.map