import { Trim } from "class-sanitizer";
import { IsNotEmpty, MaxLength, MinLength, IsOptional } from "class-validator";
import { SkipGlobalValidation } from "src/common/decorators/skip-validation.decorator";


@SkipGlobalValidation()
export class CreateProjectDto {

    @Trim()
    @IsNotEmpty({ message: "name-required" })
    @MinLength(3, {
        message: "name-too-short"
    })    
    @MaxLength(100, {
        message: "name-too-long"
    })
    name: string;

    @Trim()
    @IsOptional()
    @MaxLength(255, {
        message: "description-too-long"
    })
    description?: string;

}

