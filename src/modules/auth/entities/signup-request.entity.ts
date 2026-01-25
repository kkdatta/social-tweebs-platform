import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CampaignFrequency, SignupRequestStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'signup_requests', schema: 'zorbitads' })
export class SignupRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ name: 'business_name', length: 255 })
  businessName: string;

  @Column({
    name: 'campaign_frequency',
    type: 'enum',
    enum: CampaignFrequency,
    enumName: 'campaign_frequency',
  })
  campaignFrequency: CampaignFrequency;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: SignupRequestStatus,
    enumName: 'signup_request_status',
    default: SignupRequestStatus.PENDING,
  })
  status: SignupRequestStatus;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by' })
  processedByUser: User;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  isPending(): boolean {
    return this.status === SignupRequestStatus.PENDING;
  }
}
