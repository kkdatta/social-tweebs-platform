import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InfluencerProfile } from './influencer-profile.entity';

export enum AudienceDataType {
  GENDER = 'GENDER',
  AGE = 'AGE',
  LOCATION_COUNTRY = 'LOCATION_COUNTRY',
  LOCATION_CITY = 'LOCATION_CITY',
  INTEREST = 'INTEREST',
  BRAND_AFFINITY = 'BRAND_AFFINITY',
  LANGUAGE = 'LANGUAGE',
  REACHABILITY = 'REACHABILITY',
  CREDIBILITY = 'CREDIBILITY',
}

@Entity({ name: 'influencer_audience_data', schema: 'zorbitads' })
export class AudienceData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @ManyToOne(() => InfluencerProfile, (profile) => profile.audienceData, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: InfluencerProfile;

  @Column({
    name: 'data_type',
    type: 'enum',
    enum: AudienceDataType,
    enumName: 'audience_data_type',
  })
  dataType: AudienceDataType;

  @Column({ name: 'category_key', length: 100 })
  categoryKey: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  percentage: number;

  @Column({
    name: 'affinity_score',
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  affinityScore: number;

  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt: Date;
}
