import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedReportsController } from './generated-reports.controller';
import { GeneratedReportsService } from './generated-reports.service';
import { DiscoveryExport } from './entities/discovery-export.entity';
import { PaidCollaborationReport } from './entities/paid-collaboration-report.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiscoveryExport, PaidCollaborationReport, User]),
  ],
  controllers: [GeneratedReportsController],
  providers: [GeneratedReportsService],
  exports: [GeneratedReportsService],
})
export class GeneratedReportsModule {}
