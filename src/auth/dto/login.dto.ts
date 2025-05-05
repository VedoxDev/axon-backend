import { IsNotEmpty, MaxLength, MinLength } from "class-validator";
import { IsEmail } from "class-validator";
import { SkipGlobalValidation } from "src/common/decorators/skip-validation.decorator";

@SkipGlobalValidation()
export class LoginDto {
    @IsEmail()
    @IsNotEmpty()	
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(64)
    password: string;
}
