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
exports.StaticContent = exports.Faq = exports.FaqCategory = void 0;
const typeorm_1 = require("typeorm");
let FaqCategory = class FaqCategory {
};
exports.FaqCategory = FaqCategory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FaqCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], FaqCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], FaqCategory.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FaqCategory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FaqCategory.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], FaqCategory.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Faq, (faq) => faq.category),
    __metadata("design:type", Array)
], FaqCategory.prototype, "faqs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FaqCategory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], FaqCategory.prototype, "updatedAt", void 0);
exports.FaqCategory = FaqCategory = __decorate([
    (0, typeorm_1.Entity)({ name: 'faq_categories', schema: 'zorbitads' })
], FaqCategory);
let Faq = class Faq {
};
exports.Faq = Faq;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Faq.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', type: 'uuid' }),
    __metadata("design:type", String)
], Faq.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FaqCategory, (category) => category.faqs),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", FaqCategory)
], Faq.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Faq.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Faq.prototype, "answer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Faq.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Faq.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Faq.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Faq.prototype, "updatedAt", void 0);
exports.Faq = Faq = __decorate([
    (0, typeorm_1.Entity)({ name: 'faqs', schema: 'zorbitads' })
], Faq);
let StaticContent = class StaticContent {
};
exports.StaticContent = StaticContent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StaticContent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], StaticContent.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], StaticContent.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], StaticContent.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_updated', type: 'date' }),
    __metadata("design:type", Date)
], StaticContent.prototype, "lastUpdated", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], StaticContent.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StaticContent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], StaticContent.prototype, "updatedAt", void 0);
exports.StaticContent = StaticContent = __decorate([
    (0, typeorm_1.Entity)({ name: 'static_content', schema: 'zorbitads' })
], StaticContent);
//# sourceMappingURL=faq.entity.js.map