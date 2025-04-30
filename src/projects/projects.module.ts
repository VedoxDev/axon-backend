import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember])
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController] 
})
export class ProjectsModule {}
