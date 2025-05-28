import { IsNotEmpty, IsNumber, MinLength, MaxLength } from "class-validator";
import { IsString } from "class-validator";


export class CreateSectionDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'name-too-short' })
    @MaxLength(50, { message: 'name-too-large' })
    name: string;

    @IsNumber()
    @IsNotEmpty()
    order: number;
}
