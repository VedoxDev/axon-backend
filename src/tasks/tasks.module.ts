import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { Subtask } from './entities/subtask.entity';
import { Label } from './entities/label.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskSection } from '../sections/entities/task-section.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Subtask,
      Label,
      User,
      Project,
      TaskSection
    ])
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, TypeOrmModule]
})
export class TasksModule {} 