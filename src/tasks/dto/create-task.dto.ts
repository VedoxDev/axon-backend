import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsArray, IsUUID, IsDateString, IsIn, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'title-required' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'invalid-project-id' })
  projectId?: string; // null = personal task

  @IsOptional()
  @ValidateIf((o) => o.sectionId !== null)
  @IsInt()
  @Transform(({ value }) => value === null ? null : value)
  sectionId?: number | null; // null = no section

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'invalid-assignee-id' })
  assigneeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  labelIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  priority?: 1 | 2 | 3 | 4;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done'])
  status?: 'todo' | 'in_progress' | 'done';

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateSubtaskDto {
  @IsNotEmpty({ message: 'title-required' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order?: number;
} 