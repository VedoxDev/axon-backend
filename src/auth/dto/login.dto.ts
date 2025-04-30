import { IsNotEmpty, MaxLength, MinLength } from "class-validator";
import { IsEmail } from "class-validator";

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()	
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(64)
    password: string;
}
