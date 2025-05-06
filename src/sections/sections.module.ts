import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { TaskSection } from './entities/task-section.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TaskSection])],
  controllers: [SectionsController],
  providers: [SectionsService]
})
export class SectionsModule {}
