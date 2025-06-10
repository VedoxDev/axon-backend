import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { Message } from '../chat/entities/message.entity';
import { CallParticipant } from '../calls/entities/call.entity';
import { ProjectInvitation } from '../projects/entities/project-invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    User,
    ProjectMember,
    Task,  
    Message,
    CallParticipant,
    ProjectInvitation
  ])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
