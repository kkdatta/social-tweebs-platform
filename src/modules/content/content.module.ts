import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { FaqCategory, Faq, StaticContent } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([FaqCategory, Faq, StaticContent]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
