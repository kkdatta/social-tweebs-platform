import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PaidReportType {
  COLLABORATION = 'COLLABORATION',
  COMPARISON = 'COMPARISON',
  ANALYSIS = 'ANALYSIS',
}

export enum PaidReportFormat {
  PDF = 'PDF',
  XLSX = 'XLSX',
}

export enum PaidReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'paid_collaboration_reports', schema: 'zorbitads' })
export class PaidCollaborationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Paid Collaboration Report' })
  title: string;

  @Column({ length: 50 })
  platform: string;

  @Column({
    name: 'report_type',
    type: 'varchar',
    length: 50,
    default: PaidReportType.COLLABORATION,
  })
  reportType: PaidReportType;

  @Column({
    name: 'export_format',
    type: 'varchar',
    length: 20,
    default: PaidReportFormat.PDF,
  })
  exportFormat: PaidReportFormat;

  @Column({ name: 'influencer_count', type: 'int', default: 0 })
  influencerCount: number;

  @Column({ name: 'influencer_ids', type: 'text', array: true, nullable: true })
  influencerIds?: string[];

  @Column({ name: 'influencer_data', type: 'jsonb', nullable: true })
  influencerData?: Record<string, any>;

  @Column({ name: 'report_content', type: 'jsonb', nullable: true })
  reportContent?: Record<string, any>;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl?: string;

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes?: number;

  @Column({ name: 'date_range_start', type: 'date', nullable: true })
  dateRangeStart?: Date;

  @Column({ name: 'date_range_end', type: 'date', nullable: true })
  dateRangeEnd?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: PaidReportStatus.COMPLETED,
  })
  status: PaidReportStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({
    name: 'credits_used',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  creditsUsed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'downloaded_at', type: 'timestamp', nullable: true })
  downloadedAt?: Date;
}
