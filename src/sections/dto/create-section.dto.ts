import { IsNotEmpty, IsNumber } from "class-validator";
import { IsString } from "class-validator";


export class CreateSectionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    order: number;
}
