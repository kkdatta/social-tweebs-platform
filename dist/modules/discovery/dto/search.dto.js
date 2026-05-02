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
exports.SearchHistoryResponseDto = exports.SearchHistoryItemDto = exports.SearchResponseDto = exports.InfluencerResultDto = exports.SearchInfluencersDto = exports.SortOptionsDto = exports.AudienceFiltersDto = exports.InfluencerFiltersDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../../common/enums");
class RangeFilter {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RangeFilter.prototype, "min", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RangeFilter.prototype, "max", void 0);
class LocationFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Location ID from the locations dictionary' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LocationFilter.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weight for audience filters (0-1)', default: 0.2 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], LocationFilter.prototype, "weight", void 0);
class InterestFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Interest ID from the interests dictionary' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InterestFilter.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weight for audience filters (0-1)', default: 0.3 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], InterestFilter.prototype, "weight", void 0);
class GenderFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['MALE', 'FEMALE'], description: 'Gender code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenderFilter.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weight for audience filters (0-1)', default: 0.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], GenderFilter.prototype, "weight", void 0);
class AgeFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['13-17', '18-24', '25-34', '35-44', '45-64', '65-'], description: 'Age range code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgeFilter.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weight for audience filters (0-1)', default: 0.3 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], AgeFilter.prototype, "weight", void 0);
class AgeRangeFilter {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['13', '18', '25', '35', '45', '65'], description: 'Minimum age' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgeRangeFilter.prototype, "min", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['17', '24', '34', '44', '64'], description: 'Maximum age' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgeRangeFilter.prototype, "max", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weight (0-1)', default: 0.3 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], AgeRangeFilter.prototype, "weight", void 0);
class LanguageFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Language code (e.g., "en", "hi")' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LanguageFilter.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weight for audience filters (0-1)', default: 0.2 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], LanguageFilter.prototype, "weight", void 0);
class BrandFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Brand ID from the brands dictionary' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BrandFilter.prototype, "id", void 0);
class TextTagFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['hashtag', 'mention'], description: 'Type of tag' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TextTagFilter.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The hashtag or mention value without # or @' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TextTagFilter.prototype, "value", void 0);
class FollowersGrowthRateFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['i1month', 'i2months', 'i3months', 'i4months', 'i5months', 'i6months'],
        description: 'Time interval for growth measurement'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FollowersGrowthRateFilter.prototype, "interval", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Growth rate value (e.g., 0.01 for 1%)' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FollowersGrowthRateFilter.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['gte', 'gt', 'lt', 'lte'], description: 'Comparison operator' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FollowersGrowthRateFilter.prototype, "operator", void 0);
class ContactDetailsFilter {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['email', 'facebook', 'instagram', 'youtube', 'tiktok', 'twitter', 'snapchat', 'linkedin', 'pinterest', 'tumblr', 'twitch', 'vk', 'wechat', 'linktree', 'kik', 'skype', 'bbm', 'kakao', 'lineid', 'sarahah', 'sayat', 'itunes'],
        description: 'Type of contact channel'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactDetailsFilter.prototype, "contactType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['must', 'should', 'not'],
        description: 'Filter condition - must include, should include, or must not include',
        default: 'must'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactDetailsFilter.prototype, "filterAction", void 0);
class FilterOperationDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['and', 'or', 'not'],
        description: 'Logical operation to apply'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterOperationDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['followers', 'engagements', 'engagementRate', 'lastposted', 'bio', 'keywords', 'relevance', 'language', 'gender', 'age', 'location', 'isVerified', 'interests', 'brands', 'accountTypes', 'hasSponsoredPosts', 'textTags'],
        description: 'Filter to apply the operation on'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterOperationDto.prototype, "filter", void 0);
class InfluencerFiltersDto {
}
exports.InfluencerFiltersDto = InfluencerFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: RangeFilter, description: 'Follower count range' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RangeFilter),
    __metadata("design:type", RangeFilter)
], InfluencerFiltersDto.prototype, "followers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Engagement rate: number for >= (e.g. 0.02 for 2%), or {min,max} range' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InfluencerFiltersDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: RangeFilter, description: 'Engagements count range (NEW)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RangeFilter),
    __metadata("design:type", RangeFilter)
], InfluencerFiltersDto.prototype, "engagements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: RangeFilter, description: 'Reels plays range - Instagram only (NEW)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RangeFilter),
    __metadata("design:type", RangeFilter)
], InfluencerFiltersDto.prototype, "reelsPlays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], description: 'Array of location IDs' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Language code (e.g., "en")' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencerFiltersDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['MALE', 'FEMALE', 'KNOWN', 'UNKNOWN'], description: 'Influencer gender' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencerFiltersDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: RangeFilter, description: 'Influencer age range (values: 18, 25, 35, 45, 65)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RangeFilter),
    __metadata("design:type", RangeFilter)
], InfluencerFiltersDto.prototype, "age", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Days since last post (min 30) - Find active influencers (NEW)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(30),
    __metadata("design:type", Number)
], InfluencerFiltersDto.prototype, "lastposted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search in bio description and/or full name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencerFiltersDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Keyword phrase used in post captions (NEW)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencerFiltersDto.prototype, "keywords", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [TextTagFilter],
        description: 'Filter by hashtags or mentions used in posts (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TextTagFilter),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "textTags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Relevance/lookalike by topic - hashtags (#cars) or usernames (@topgear) (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "relevance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Audience similarity lookalike - usernames like @topgear (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "audienceRelevance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by verified accounts only' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InfluencerFiltersDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [Number],
        description: 'Account types: 1=Regular, 2=Business, 3=Creator'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "accountTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by influencers with sponsored posts (NEW)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InfluencerFiltersDto.prototype, "hasSponsoredPosts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by influencers with YouTube channel (NEW)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InfluencerFiltersDto.prototype, "hasYouTube", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [ContactDetailsFilter],
        description: 'Filter by specific contact channel types (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ContactDetailsFilter),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "hasContactDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], description: 'Array of brand IDs the influencer has worked with' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "brands", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], description: 'Array of interest IDs' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "interests", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: FollowersGrowthRateFilter,
        description: 'Filter by followers growth rate over time (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FollowersGrowthRateFilter),
    __metadata("design:type", FollowersGrowthRateFilter)
], InfluencerFiltersDto.prototype, "followersGrowthRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [FilterOperationDto],
        description: 'Combine filters with AND/OR/NOT logic (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FilterOperationDto),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "filterOperations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by username' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencerFiltersDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Filter by influencer category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InfluencerFiltersDto.prototype, "categories", void 0);
class AudienceFiltersDto {
}
exports.AudienceFiltersDto = AudienceFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [LocationFilter],
        description: 'Audience location with weight (default 0.2)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LocationFilter),
    __metadata("design:type", Array)
], AudienceFiltersDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: GenderFilter,
        description: 'Audience gender (followers) with weight (default 0.5)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GenderFilter),
    __metadata("design:type", GenderFilter)
], AudienceFiltersDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: GenderFilter,
        description: 'Engagers gender with weight (default 0.5)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GenderFilter),
    __metadata("design:type", GenderFilter)
], AudienceFiltersDto.prototype, "engagersGender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [AgeFilter],
        description: 'Audience age groups with weight (default 0.3)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AgeFilter),
    __metadata("design:type", Array)
], AudienceFiltersDto.prototype, "age", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: AgeRangeFilter,
        description: 'Custom audience age range - alternative to age[] (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AgeRangeFilter),
    __metadata("design:type", AgeRangeFilter)
], AudienceFiltersDto.prototype, "ageRange", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [InterestFilter],
        description: 'Audience interests with weight (default 0.3)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InterestFilter),
    __metadata("design:type", Array)
], AudienceFiltersDto.prototype, "interests", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: LanguageFilter,
        description: 'Audience language with weight (default 0.2)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LanguageFilter),
    __metadata("design:type", LanguageFilter)
], AudienceFiltersDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Audience credibility - inverse of fake followers (e.g., 0.75 = 25% fake) (NEW)',
        minimum: 0,
        maximum: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], AudienceFiltersDto.prototype, "credibility", void 0);
class SortOptionsDto {
}
exports.SortOptionsDto = SortOptionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            'followers', 'engagements', 'engagementRate',
            'keywords', 'relevance', 'followersGrowth', 'reelsPlays',
            'audienceGeo', 'audienceLang', 'audienceGender', 'audienceAge',
            'audienceInterest', 'audienceRelevance'
        ],
        description: 'Sort field - some require corresponding filter to be applied'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SortOptionsDto.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SortOptionsDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Required for audienceGeo and audienceInterest sorting - the ID to sort by'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SortOptionsDto.prototype, "value", void 0);
class SearchInfluencersDto {
    constructor() {
        this.page = 0;
    }
}
exports.SearchInfluencersDto = SearchInfluencersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlatformType, description: 'Platform to search on' }),
    (0, class_validator_1.IsEnum)(enums_1.PlatformType),
    __metadata("design:type", String)
], SearchInfluencersDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: InfluencerFiltersDto, description: 'Influencer profile filters' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InfluencerFiltersDto),
    __metadata("design:type", InfluencerFiltersDto)
], SearchInfluencersDto.prototype, "influencer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: AudienceFiltersDto, description: 'Audience demographic filters' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AudienceFiltersDto),
    __metadata("design:type", AudienceFiltersDto)
], SearchInfluencersDto.prototype, "audience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: SortOptionsDto, description: 'Sorting options' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SortOptionsDto),
    __metadata("design:type", SortOptionsDto)
], SearchInfluencersDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0, description: 'Page number (0-indexed)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchInfluencersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['median', 'average'],
        description: 'Method for computing average-based metrics (NEW)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchInfluencersDto.prototype, "calculationMethod", void 0);
class InfluencerResultDto {
}
exports.InfluencerResultDto = InfluencerResultDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "platformUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlatformType }),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "avgLikes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "avgComments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "avgViews", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Average reels plays (Instagram)' }),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "avgReelsPlays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InfluencerResultDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "locationCountry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "locationCity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerResultDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Followers growth rate' }),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "followersGrowthRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Has sponsored posts' }),
    __metadata("design:type", Boolean)
], InfluencerResultDto.prototype, "hasSponsoredPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InfluencerResultDto.prototype, "isBlurred", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerResultDto.prototype, "rankPosition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Match data for the applied filters' }),
    __metadata("design:type", Object)
], InfluencerResultDto.prototype, "match", void 0);
class SearchResponseDto {
}
exports.SearchResponseDto = SearchResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResponseDto.prototype, "searchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchResponseDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InfluencerResultDto] }),
    __metadata("design:type", Array)
], SearchResponseDto.prototype, "results", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchResponseDto.prototype, "resultCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchResponseDto.prototype, "totalAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SearchResponseDto.prototype, "hasMore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchResponseDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchResponseDto.prototype, "remainingBalance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether results exactly match filters or are similar' }),
    __metadata("design:type", Boolean)
], SearchResponseDto.prototype, "isExactMatch", void 0);
class SearchHistoryItemDto {
}
exports.SearchHistoryItemDto = SearchHistoryItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchHistoryItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchHistoryItemDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], SearchHistoryItemDto.prototype, "filtersApplied", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchHistoryItemDto.prototype, "resultCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchHistoryItemDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SearchHistoryItemDto.prototype, "createdAt", void 0);
class SearchHistoryResponseDto {
}
exports.SearchHistoryResponseDto = SearchHistoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SearchHistoryItemDto] }),
    __metadata("design:type", Array)
], SearchHistoryResponseDto.prototype, "searches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchHistoryResponseDto.prototype, "total", void 0);
//# sourceMappingURL=search.dto.js.map