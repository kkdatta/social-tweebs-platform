import { Repository } from 'typeorm';
import { FaqCategory, Faq, StaticContent } from './entities';
import { FaqListResponseDto, FaqCategoryWithCountDto, StaticContentDto } from './dto';
export declare class ContentService {
    private readonly faqCategoryRepo;
    private readonly faqRepo;
    private readonly staticContentRepo;
    constructor(faqCategoryRepo: Repository<FaqCategory>, faqRepo: Repository<Faq>, staticContentRepo: Repository<StaticContent>);
    getAllFaqs(): Promise<FaqListResponseDto>;
    getFaqCategories(): Promise<FaqCategoryWithCountDto[]>;
    getFaqsByCategory(slug: string): Promise<FaqCategory & {
        faqs: Faq[];
    }>;
    getFaqById(id: string): Promise<Faq>;
    getStaticContent(slug: string): Promise<StaticContentDto>;
    getPrivacyPolicy(): Promise<StaticContentDto>;
    getTermsConditions(): Promise<StaticContentDto>;
    searchFaqs(query: string): Promise<Faq[]>;
}
