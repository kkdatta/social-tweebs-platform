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

export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
  JSON = 'JSON',
}

export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'discovery_exports', schema: 'zorbitads' })
export class DiscoveryExport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Discovery Export' })
  title: string;

  @Column({ length: 50 })
  platform: string;

  @Column({
    name: 'export_format',
    type: 'varchar',
    length: 20,
    default: ExportFormat.CSV,
  })
  exportFormat: ExportFormat;

  @Column({ name: 'profile_count', type: 'int', default: 0 })
  profileCount: number;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl?: string;

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes?: number;

  @Column({ name: 'search_filters', type: 'jsonb', nullable: true })
  searchFilters?: Record<string, any>;

  @Column({ name: 'exported_profile_ids', type: 'text', array: true, nullable: true })
  exportedProfileIds?: string[];

  @Column({
    type: 'varchar',
    length: 50,
    default: ExportStatus.COMPLETED,
  })
  status: ExportStatus;

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
