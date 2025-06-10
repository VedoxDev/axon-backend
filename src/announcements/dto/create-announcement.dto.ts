import { IsNotEmpty, IsOptional, IsEnum, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { SkipGlobalValidation } from 'src/common/decorators/skip-validation.decorator';

@SkipGlobalValidation()
export class CreateAnnouncementDto {
  @IsNotEmpty({ message: 'title-required' })
  @MinLength(3, { message: 'title-too-short' })
  @MaxLength(200, { message: 'title-too-long' })
  title: string;

  @IsNotEmpty({ message: 'content-required' })
  @MinLength(10, { message: 'content-too-short' })
  @MaxLength(2000, { message: 'content-too-long' })
  content: string;

  @IsOptional()
  @IsEnum(['info', 'warning', 'success', 'urgent'], { 
    message: 'type-must-be-info-warning-success-or-urgent' 
  })
  type?: 'info' | 'warning' | 'success' | 'urgent';

  @IsOptional()
  @IsBoolean({ message: 'pinned-must-be-boolean' })
  pinned?: boolean;
} 