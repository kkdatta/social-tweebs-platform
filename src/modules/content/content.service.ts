import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqCategory, Faq, StaticContent } from './entities';
import {
  FaqListResponseDto,
  FaqCategoryWithCountDto,
  StaticContentDto,
} from './dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(FaqCategory)
    private readonly faqCategoryRepo: Repository<FaqCategory>,
    @InjectRepository(Faq)
    private readonly faqRepo: Repository<Faq>,
    @InjectRepository(StaticContent)
    private readonly staticContentRepo: Repository<StaticContent>,
  ) {}

  /**
   * Get all FAQ categories with their FAQs
   */
  async getAllFaqs(): Promise<FaqListResponseDto> {
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

  /**
   * Get FAQ categories with FAQ counts
   */
  async getFaqCategories(): Promise<FaqCategoryWithCountDto[]> {
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

  /**
   * Get FAQs by category slug
   */
  async getFaqsByCategory(slug: string): Promise<FaqCategory & { faqs: Faq[] }> {
    const category = await this.faqCategoryRepo.findOne({
      where: { slug, isActive: true },
      relations: ['faqs'],
    });

    if (!category) {
      throw new NotFoundException(`FAQ category '${slug}' not found`);
    }

    // Filter and sort FAQs
    category.faqs = category.faqs
      .filter((faq) => faq.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return category;
  }

  /**
   * Get a single FAQ by ID
   */
  async getFaqById(id: string): Promise<Faq> {
    const faq = await this.faqRepo.findOne({
      where: { id, isActive: true },
      relations: ['category'],
    });

    if (!faq) {
      throw new NotFoundException(`FAQ not found`);
    }

    return faq;
  }

  /**
   * Get static content by slug (privacy-policy, terms-conditions)
   */
  async getStaticContent(slug: string): Promise<StaticContentDto> {
    const content = await this.staticContentRepo.findOne({
      where: { slug, isActive: true },
    });

    if (!content) {
      throw new NotFoundException(`Content '${slug}' not found`);
    }

    // Handle lastUpdated - cast to any to handle both Date and string
    const lastUpdatedValue = content.lastUpdated as any;
    let lastUpdatedStr: string;
    if (lastUpdatedValue instanceof Date) {
      lastUpdatedStr = lastUpdatedValue.toISOString().split('T')[0];
    } else if (typeof lastUpdatedValue === 'string') {
      lastUpdatedStr = lastUpdatedValue.split('T')[0];
    } else {
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

  /**
   * Get Privacy Policy
   */
  async getPrivacyPolicy(): Promise<StaticContentDto> {
    return this.getStaticContent('privacy-policy');
  }

  /**
   * Get Terms & Conditions
   */
  async getTermsConditions(): Promise<StaticContentDto> {
    return this.getStaticContent('terms-conditions');
  }

  /**
   * Search FAQs by keyword
   */
  async searchFaqs(query: string): Promise<Faq[]> {
    const searchTerm = `%${query.toLowerCase()}%`;

    const faqs = await this.faqRepo
      .createQueryBuilder('faq')
      .leftJoinAndSelect('faq.category', 'category')
      .where('faq.is_active = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(faq.question) LIKE :term OR LOWER(faq.answer) LIKE :term)',
        { term: searchTerm },
      )
      .orderBy('category.display_order', 'ASC')
      .addOrderBy('faq.display_order', 'ASC')
      .getMany();

    return faqs;
  }
}
