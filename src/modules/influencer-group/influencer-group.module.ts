import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfluencerGroupController } from './influencer-group.controller';
import { InfluencerGroupService } from './influencer-group.service';
import {
  InfluencerGroup,
  InfluencerGroupMember,
  InfluencerGroupShare,
  GroupInvitation,
  GroupInvitationApplication,
} from './entities/influencer-group.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InfluencerGroup,
      InfluencerGroupMember,
      InfluencerGroupShare,
      GroupInvitation,
      GroupInvitationApplication,
      User,
    ]),
  ],
  controllers: [InfluencerGroupController],
  providers: [InfluencerGroupService],
  exports: [InfluencerGroupService],
})
export class InfluencerGroupModule {}
