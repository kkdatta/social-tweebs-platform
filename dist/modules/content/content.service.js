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
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./entities");
let ContentService = class ContentService {
    constructor(faqCategoryRepo, faqRepo, staticContentRepo) {
        this.faqCategoryRepo = faqCategoryRepo;
        this.faqRepo = faqRepo;
        this.staticContentRepo = staticContentRepo;
    }
    async getAllFaqs() {
        const categories = await this.faqCategoryRepo.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC' },
            relations: ['faqs'],
        });
        return {
            categories: categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                displayOrder: cat.displayOrder,
                faqs: cat.faqs
                    .filter((faq) => faq.isActive)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((faq) => ({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                    displayOrder: faq.displayOrder,
                })),
            })),
        };
    }
    async getFaqCategories() {
        const categories = await this.faqCategoryRepo.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC' },
            relations: ['faqs'],
        });
        return categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            faqCount: cat.faqs.filter((faq) => faq.isActive).length,
        }));
    }
    async getFaqsByCategory(slug) {
        const category = await this.faqCategoryRepo.findOne({
            where: { slug, isActive: true },
            relations: ['faqs'],
        });
        if (!category) {
            throw new common_1.NotFoundException(`FAQ category '${slug}' not found`);
        }
        category.faqs = category.faqs
            .filter((faq) => faq.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder);
        return category;
    }
    async getFaqById(id) {
        const faq = await this.faqRepo.findOne({
            where: { id, isActive: true },
            relations: ['category'],
        });
        if (!faq) {
            throw new common_1.NotFoundException(`FAQ not found`);
        }
        return faq;
    }
    async getStaticContent(slug) {
        const content = await this.staticContentRepo.findOne({
            where: { slug, isActive: true },
        });
        if (!content) {
            throw new common_1.NotFoundException(`Content '${slug}' not found`);
        }
        const lastUpdatedValue = content.lastUpdated;
        let lastUpdatedStr;
        if (lastUpdatedValue instanceof Date) {
            lastUpdatedStr = lastUpdatedValue.toISOString().split('T')[0];
        }
        else if (typeof lastUpdatedValue === 'string') {
            lastUpdatedStr = lastUpdatedValue.split('T')[0];
        }
        else {
            lastUpdatedStr = String(lastUpdatedValue);
        }
        return {
            id: content.id,
            slug: content.slug,
            title: content.title,
            content: content.content,
            lastUpdated: lastUpdatedStr,
        };
    }
    async getPrivacyPolicy() {
        return this.getStaticContent('privacy-policy');
    }
    async getTermsConditions() {
        return this.getStaticContent('terms-conditions');
    }
    async searchFaqs(query) {
        const searchTerm = `%${query.toLowerCase()}%`;
        const faqs = await this.faqRepo
            .createQueryBuilder('faq')
            .leftJoinAndSelect('faq.category', 'category')
            .where('faq.is_active = :isActive', { isActive: true })
            .andWhere('(LOWER(faq.question) LIKE :term OR LOWER(faq.answer) LIKE :term)', { term: searchTerm })
            .orderBy('category.display_order', 'ASC')
            .addOrderBy('faq.display_order', 'ASC')
            .getMany();
        return faqs;
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.FaqCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Faq)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.StaticContent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ContentService);
//# sourceMappingURL=content.service.js.map