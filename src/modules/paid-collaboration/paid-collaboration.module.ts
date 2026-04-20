import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaidCollaborationController } from './paid-collaboration.controller';
import { PaidCollaborationService } from './paid-collaboration.service';
import {
  PaidCollabReport,
  PaidCollabInfluencer,
  PaidCollabPost,
  PaidCollabShare,
  PaidCollabCategorization,
} from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaidCollabReport,
      PaidCollabInfluencer,
      PaidCollabPost,
      PaidCollabShare,
      PaidCollabCategorization,
      User,
    ]),
    CreditsModule,
    DiscoveryModule,
  ],
  controllers: [PaidCollaborationController],
  providers: [PaidCollaborationService],
  exports: [PaidCollaborationService],
})
export class PaidCollaborationModule {}
