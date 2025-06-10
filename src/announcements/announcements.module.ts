import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Announcement, 
      AnnouncementRead, 
      Project, 
      ProjectMember
    ])
  ],
  providers: [AnnouncementsService],
  controllers: [AnnouncementsController],
  exports: [TypeOrmModule, AnnouncementsService]
})
export class AnnouncementsModule {} 