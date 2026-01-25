import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiscoverySearch } from './discovery-search.entity';
import { InfluencerProfile } from './influencer-profile.entity';

@Entity({ name: 'discovery_search_results', schema: 'zorbitads' })
export class SearchResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'search_id', type: 'uuid' })
  searchId: string;

  @ManyToOne(() => DiscoverySearch, (search) => search.results, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'search_id' })
  search: DiscoverySearch;

  @Column({ name: 'influencer_profile_id', type: 'uuid' })
  influencerProfileId: string;

  @ManyToOne(() => InfluencerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencer_profile_id' })
  influencerProfile: InfluencerProfile;

  @Column({ name: 'rank_position', type: 'int' })
  rankPosition: number;

  @Column({
    name: 'relevance_score',
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  relevanceScore: number;

  @Column({ name: 'is_blurred', default: true })
  isBlurred: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt: Date;
}
