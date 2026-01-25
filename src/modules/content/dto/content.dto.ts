import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// FAQ DTOs
export class FaqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answer: string;

  @ApiProperty()
  displayOrder: number;
}

export class FaqCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty({ type: [FaqDto] })
  faqs: FaqDto[];
}

export class FaqListResponseDto {
  @ApiProperty({ type: [FaqCategoryDto] })
  categories: FaqCategoryDto[];
}

export class FaqCategoryWithCountDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  faqCount: number;
}

// Static Content DTOs
export class StaticContentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  lastUpdated: string;
}

export class StaticContentListDto {
  @ApiProperty({ type: [StaticContentDto] })
  items: StaticContentDto[];
}
