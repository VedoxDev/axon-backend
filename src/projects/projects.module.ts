import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { UsersModule } from 'src/users/users.module';
import { SectionsModule } from 'src/sections/sections.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, ProjectInvitation]),
    UsersModule,
    SectionsModule
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [TypeOrmModule]
})
export class ProjectsModule {}
