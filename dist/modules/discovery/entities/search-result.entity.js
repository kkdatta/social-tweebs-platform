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
exports.SearchResult = void 0;
const typeorm_1 = require("typeorm");
const discovery_search_entity_1 = require("./discovery-search.entity");
const influencer_profile_entity_1 = require("./influencer-profile.entity");
let SearchResult = class SearchResult {
};
exports.SearchResult = SearchResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SearchResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'search_id', type: 'uuid' }),
    __metadata("design:type", String)
], SearchResult.prototype, "searchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => discovery_search_entity_1.DiscoverySearch, (search) => search.results, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'search_id' }),
    __metadata("design:type", discovery_search_entity_1.DiscoverySearch)
], SearchResult.prototype, "search", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'influencer_profile_id', type: 'uuid' }),
    __metadata("design:type", String)
], SearchResult.prototype, "influencerProfileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => influencer_profile_entity_1.InfluencerProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'influencer_profile_id' }),
    __metadata("design:type", influencer_profile_entity_1.InfluencerProfile)
], SearchResult.prototype, "influencerProfile", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rank_position', type: 'int' }),
    __metadata("design:type", Number)
], SearchResult.prototype, "rankPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'relevance_score',
        type: 'decimal',
        precision: 8,
        scale: 4,
        nullable: true,
    }),
    __metadata("design:type", Number)
], SearchResult.prototype, "relevanceScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_blurred', default: true }),
    __metadata("design:type", Boolean)
], SearchResult.prototype, "isBlurred", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SearchResult.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SearchResult.prototype, "lastUpdatedAt", void 0);
exports.SearchResult = SearchResult = __decorate([
    (0, typeorm_1.Entity)({ name: 'discovery_search_results', schema: 'zorbitads' })
], SearchResult);
//# sourceMappingURL=search-result.entity.js.map