import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { TaskSection } from './entities/task-section.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskSection]), ProjectsModule],
  controllers: [SectionsController],
  providers: [SectionsService]
})
export class SectionsModule {}
