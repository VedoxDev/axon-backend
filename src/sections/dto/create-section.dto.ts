import { IsNotEmpty, IsNumber, MinLength, MaxLength, IsOptional } from "class-validator";
import { IsString } from "class-validator";


export class CreateSectionDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'name-too-short' })
    @MaxLength(50, { message: 'name-too-large' })
    name: string;

    @IsNumber()
    @IsOptional()
    order?: number;
}

export class UpdateSectionDto {
    @IsString()
    @IsOptional()
    @MinLength(3, { message: 'name-too-short' })
    @MaxLength(50, { message: 'name-too-large' })
    name?: string;

    @IsNumber()
    @IsOptional()
    order?: number;
}

export class ReorderSectionsDto {
    @IsNumber({}, { each: true })
    @IsNotEmpty()
    sectionIds: number[];
}
