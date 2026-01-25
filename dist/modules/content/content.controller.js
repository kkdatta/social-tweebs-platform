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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const content_service_1 = require("./content.service");
const dto_1 = require("./dto");
let ContentController = class ContentController {
    constructor(contentService) {
        this.contentService = contentService;
    }
    async getAllFaqs() {
        return this.contentService.getAllFaqs();
    }
    async getFaqCategories() {
        return this.contentService.getFaqCategories();
    }
    async searchFaqs(query) {
        const faqs = await this.contentService.searchFaqs(query || '');
        return {
            query,
            results: faqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
                category: {
                    id: faq.category.id,
                    name: faq.category.name,
                    slug: faq.category.slug,
                },
            })),
        };
    }
    async getFaqsByCategory(slug) {
        const category = await this.contentService.getFaqsByCategory(slug);
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            faqs: category.faqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
                displayOrder: faq.displayOrder,
            })),
        };
    }
    async getFaqById(id) {
        const faq = await this.contentService.getFaqById(id);
        return {
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            category: {
                id: faq.category.id,
                name: faq.category.name,
                slug: faq.category.slug,
            },
        };
    }
    async getPrivacyPolicy() {
        return this.contentService.getPrivacyPolicy();
    }
    async getTermsConditions() {
        return this.contentService.getTermsConditions();
    }
    async getStaticContent(slug) {
        return this.contentService.getStaticContent(slug);
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Get)('faqs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all FAQs grouped by category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'FAQs retrieved successfully', type: dto_1.FaqListResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getAllFaqs", null);
__decorate([
    (0, common_1.Get)('faqs/categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get FAQ categories with counts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories retrieved successfully', type: [dto_1.FaqCategoryWithCountDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getFaqCategories", null);
__decorate([
    (0, common_1.Get)('faqs/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search FAQs by keyword' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "searchFaqs", null);
__decorate([
    (0, common_1.Get)('faqs/category/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get FAQs by category slug' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Category slug (general, influencer-discovery, influencer-insights)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category FAQs retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getFaqsByCategory", null);
__decorate([
    (0, common_1.Get)('faqs/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single FAQ by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'FAQ ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'FAQ retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'FAQ not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getFaqById", null);
__decorate([
    (0, common_1.Get)('privacy-policy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Privacy Policy' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Privacy Policy retrieved', type: dto_1.StaticContentDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getPrivacyPolicy", null);
__decorate([
    (0, common_1.Get)('terms-conditions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Terms & Conditions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Terms & Conditions retrieved', type: dto_1.StaticContentDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getTermsConditions", null);
__decorate([
    (0, common_1.Get)('page/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get static content page by slug' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Page slug (privacy-policy, terms-conditions)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content retrieved', type: dto_1.StaticContentDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Content not found' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getStaticContent", null);
exports.ContentController = ContentController = __decorate([
    (0, swagger_1.ApiTags)('content'),
    (0, common_1.Controller)('content'),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], ContentController);
//# sourceMappingURL=content.controller.js.map