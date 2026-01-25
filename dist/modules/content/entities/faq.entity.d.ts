export declare class FaqCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    faqs: Faq[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class Faq {
    id: string;
    categoryId: string;
    category: FaqCategory;
    question: string;
    answer: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class StaticContent {
    id: string;
    slug: string;
    title: string;
    content: string;
    lastUpdated: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
