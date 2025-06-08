import { IsNotEmpty, IsString, IsHexColor, MinLength, MaxLength } from 'class-validator';

export class CreateLabelDto {
  @IsNotEmpty({ message: 'name-required' })
  @IsString()
  @MinLength(1, { message: 'name-too-short' })
  @MaxLength(30, { message: 'name-too-long' })
  name: string;

  @IsNotEmpty({ message: 'color-required' })
  @IsHexColor({ message: 'invalid-hex-color' })
  color: string; // e.g., "#10B981"
}

export class UpdateLabelDto {
  @IsString()
  @MinLength(1, { message: 'name-too-short' })
  @MaxLength(30, { message: 'name-too-long' })
  name?: string;

  @IsHexColor({ message: 'invalid-hex-color' })
  color?: string;
} 