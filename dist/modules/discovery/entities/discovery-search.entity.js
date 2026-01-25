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
exports.DiscoverySearch = exports.SearchStatus = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
const search_result_entity_1 = require("./search-result.entity");
var SearchStatus;
(function (SearchStatus) {
    SearchStatus["PENDING"] = "PENDING";
    SearchStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SearchStatus["COMPLETED"] = "COMPLETED";
    SearchStatus["FAILED"] = "FAILED";
})(SearchStatus || (exports.SearchStatus = SearchStatus = {}));
let DiscoverySearch = class DiscoverySearch {
};
exports.DiscoverySearch = DiscoverySearch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], DiscoverySearch.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.PlatformType,
        enumName: 'social_platform',
    }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'search_query', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "searchQuery", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filters_applied', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], DiscoverySearch.prototype, "filtersApplied", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'result_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DiscoverySearch.prototype, "resultCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modash_request_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "modashRequestId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'credits_used',
        type: 'decimal',
        precision: 10,
        scale: 4,
        default: 0,
    }),
    __metadata("design:type", Number)
], DiscoverySearch.prototype, "creditsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SearchStatus,
        enumName: 'search_status',
        default: SearchStatus.PENDING,
    }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modash_response_time_ms', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DiscoverySearch.prototype, "modashResponseTimeMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DiscoverySearch.prototype, "page", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_available', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DiscoverySearch.prototype, "totalAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'has_more', default: false }),
    __metadata("design:type", Boolean)
], DiscoverySearch.prototype, "hasMore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_field', length: 50, nullable: true }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "sortField", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_direction', length: 10, nullable: true }),
    __metadata("design:type", String)
], DiscoverySearch.prototype, "sortDirection", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => search_result_entity_1.SearchResult, (result) => result.search),
    __metadata("design:type", Array)
], DiscoverySearch.prototype, "results", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DiscoverySearch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DiscoverySearch.prototype, "lastUpdatedAt", void 0);
exports.DiscoverySearch = DiscoverySearch = __decorate([
    (0, typeorm_1.Entity)({ name: 'discovery_searches', schema: 'zorbitads' })
], DiscoverySearch);
//# sourceMappingURL=discovery-search.entity.js.map