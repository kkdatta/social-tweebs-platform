import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ActionName } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'action_permissions', schema: 'zorbitads' })
@Unique(['userId', 'actionName'])
export class ActionPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'action_name',
    type: 'enum',
    enum: ActionName,
    enumName: 'action_name',
  })
  actionName: ActionName;

  @Column({ name: 'is_enabled', default: false })
  isEnabled: boolean;

  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by' })
  grantor: User;

  @CreateDateColumn({ name: 'granted_at', type: 'timestamptz' })
  grantedAt: Date;
}
