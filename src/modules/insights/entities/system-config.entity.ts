import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'system_config', schema: 'zorbitads' })
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_key', type: 'varchar', length: 100, unique: true })
  configKey: string;

  @Column({ name: 'config_value', type: 'text' })
  configValue: string;

  @Column({ name: 'data_type', type: 'varchar', length: 20, default: 'string' })
  dataType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
