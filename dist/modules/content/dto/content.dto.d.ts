export declare class FaqDto {
    id: string;
    question: string;
    answer: string;
    displayOrder: number;
}
export declare class FaqCategoryDto {
    id: string;
    name: string;
    slug: string;
    description?: string;
    displayOrder: number;
    faqs: FaqDto[];
}
export declare class FaqListResponseDto {
    categories: FaqCategoryDto[];
}
export declare class FaqCategoryWithCountDto {
    id: string;
    name: string;
    slug: string;
    description?: string;
    faqCount: number;
}
export declare class StaticContentDto {
    id: string;
    slug: string;
    title: string;
    content: string;
    lastUpdated: string;
}
export declare class StaticContentListDto {
    items: StaticContentDto[];
}
