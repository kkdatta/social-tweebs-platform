import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import {
  FaqListResponseDto,
  FaqCategoryWithCountDto,
  StaticContentDto,
} from './dto';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ==================== FAQ Endpoints ====================

  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQs grouped by category' })
  @ApiResponse({ status: 200, description: 'FAQs retrieved successfully', type: FaqListResponseDto })
  async getAllFaqs(): Promise<FaqListResponseDto> {
    return this.contentService.getAllFaqs();
  }

  @Get('faqs/categories')
  @ApiOperation({ summary: 'Get FAQ categories with counts' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully', type: [FaqCategoryWithCountDto] })
  async getFaqCategories(): Promise<FaqCategoryWithCountDto[]> {
    return this.contentService.getFaqCategories();
  }

  @Get('faqs/search')
  @ApiOperation({ summary: 'Search FAQs by keyword' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchFaqs(@Query('q') query: string) {
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

  @Get('faqs/category/:slug')
  @ApiOperation({ summary: 'Get FAQs by category slug' })
  @ApiParam({ name: 'slug', description: 'Category slug (general, influencer-discovery, influencer-insights)' })
  @ApiResponse({ status: 200, description: 'Category FAQs retrieved' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getFaqsByCategory(@Param('slug') slug: string) {
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

  @Get('faqs/:id')
  @ApiOperation({ summary: 'Get a single FAQ by ID' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ status: 200, description: 'FAQ retrieved' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async getFaqById(@Param('id') id: string) {
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

  // ==================== Static Content Endpoints ====================

  @Get('privacy-policy')
  @ApiOperation({ summary: 'Get Privacy Policy' })
  @ApiResponse({ status: 200, description: 'Privacy Policy retrieved', type: StaticContentDto })
  async getPrivacyPolicy(): Promise<StaticContentDto> {
    return this.contentService.getPrivacyPolicy();
  }

  @Get('terms-conditions')
  @ApiOperation({ summary: 'Get Terms & Conditions' })
  @ApiResponse({ status: 200, description: 'Terms & Conditions retrieved', type: StaticContentDto })
  async getTermsConditions(): Promise<StaticContentDto> {
    return this.contentService.getTermsConditions();
  }

  @Get('page/:slug')
  @ApiOperation({ summary: 'Get static content page by slug' })
  @ApiParam({ name: 'slug', description: 'Page slug (privacy-policy, terms-conditions)' })
  @ApiResponse({ status: 200, description: 'Content retrieved', type: StaticContentDto })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getStaticContent(@Param('slug') slug: string): Promise<StaticContentDto> {
    return this.contentService.getStaticContent(slug);
  }
}
