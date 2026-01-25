import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { SearchResult } from './search-result.entity';

export enum SearchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'discovery_searches', schema: 'zorbitads' })
export class DiscoverySearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PlatformType,
    enumName: 'social_platform',
  })
  platform: PlatformType;

  @Column({ name: 'search_query', type: 'text', nullable: true })
  searchQuery: string;

  @Column({ name: 'filters_applied', type: 'jsonb', default: {} })
  filtersApplied: Record<string, any>;

  @Column({ name: 'result_count', type: 'int', default: 0 })
  resultCount: number;

  @Column({ name: 'modash_request_id', length: 255, nullable: true })
  modashRequestId: string;

  @Column({
    name: 'credits_used',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
  })
  creditsUsed: number;

  @Column({
    type: 'enum',
    enum: SearchStatus,
    enumName: 'search_status',
    default: SearchStatus.PENDING,
  })
  status: SearchStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'modash_response_time_ms', type: 'int', nullable: true })
  modashResponseTimeMs: number;

  @Column({ type: 'int', default: 0 })
  page: number;

  @Column({ name: 'total_available', type: 'int', nullable: true })
  totalAvailable: number;

  @Column({ name: 'has_more', default: false })
  hasMore: boolean;

  @Column({ name: 'sort_field', length: 50, nullable: true })
  sortField: string;

  @Column({ name: 'sort_direction', length: 10, nullable: true })
  sortDirection: string;

  @OneToMany(() => SearchResult, (result) => result.search)
  results: SearchResult[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt: Date;
}
