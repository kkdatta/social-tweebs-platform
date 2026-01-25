import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserPreferences } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreferences])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
