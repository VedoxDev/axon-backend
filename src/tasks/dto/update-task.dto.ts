import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean, IsInt } from 'class-validator';
import { CreateTaskDto, CreateSubtaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class UpdateSubtaskDto extends PartialType(CreateSubtaskDto) {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class ReorderTasksDto {
  @IsOptional()
  @IsInt({ each: true })
  taskIds: string[];
} 