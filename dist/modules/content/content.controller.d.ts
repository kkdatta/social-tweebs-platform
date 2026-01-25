import { ContentService } from './content.service';
import { FaqListResponseDto, FaqCategoryWithCountDto, StaticContentDto } from './dto';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    getAllFaqs(): Promise<FaqListResponseDto>;
    getFaqCategories(): Promise<FaqCategoryWithCountDto[]>;
    searchFaqs(query: string): Promise<{
        query: string;
        results: {
            id: string;
            question: string;
            answer: string;
            category: {
                id: string;
                name: string;
                slug: string;
            };
        }[];
    }>;
    getFaqsByCategory(slug: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | undefined;
        faqs: {
            id: string;
            question: string;
            answer: string;
            displayOrder: number;
        }[];
    }>;
    getFaqById(id: string): Promise<{
        id: string;
        question: string;
        answer: string;
        category: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
    getPrivacyPolicy(): Promise<StaticContentDto>;
    getTermsConditions(): Promise<StaticContentDto>;
    getStaticContent(slug: string): Promise<StaticContentDto>;
}
