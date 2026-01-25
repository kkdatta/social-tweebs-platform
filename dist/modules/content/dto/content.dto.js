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
exports.StaticContentListDto = exports.StaticContentDto = exports.FaqCategoryWithCountDto = exports.FaqListResponseDto = exports.FaqCategoryDto = exports.FaqDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class FaqDto {
}
exports.FaqDto = FaqDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqDto.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], FaqDto.prototype, "displayOrder", void 0);
class FaqCategoryDto {
}
exports.FaqCategoryDto = FaqCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqCategoryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqCategoryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqCategoryDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FaqCategoryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], FaqCategoryDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FaqDto] }),
    __metadata("design:type", Array)
], FaqCategoryDto.prototype, "faqs", void 0);
class FaqListResponseDto {
}
exports.FaqListResponseDto = FaqListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FaqCategoryDto] }),
    __metadata("design:type", Array)
], FaqListResponseDto.prototype, "categories", void 0);
class FaqCategoryWithCountDto {
}
exports.FaqCategoryWithCountDto = FaqCategoryWithCountDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqCategoryWithCountDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqCategoryWithCountDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FaqCategoryWithCountDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FaqCategoryWithCountDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], FaqCategoryWithCountDto.prototype, "faqCount", void 0);
class StaticContentDto {
}
exports.StaticContentDto = StaticContentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaticContentDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaticContentDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaticContentDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaticContentDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StaticContentDto.prototype, "lastUpdated", void 0);
class StaticContentListDto {
}
exports.StaticContentListDto = StaticContentListDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StaticContentDto] }),
    __metadata("design:type", Array)
], StaticContentListDto.prototype, "items", void 0);
//# sourceMappingURL=content.dto.js.map