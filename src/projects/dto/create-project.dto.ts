import { Trim } from "class-sanitizer";
import { IsNotEmpty, MaxLength, MinLength } from "class-validator";
import { Entity } from "typeorm";

@Entity("project")
export class CreateProjectDto {

    @Trim()
    @IsNotEmpty({ message : "name-required"})
    @MinLength(8, {
        message: "name-too-short"
    })    
    @MaxLength(100, {
        message: "name-too-long"
    })
    name : string;

    @Trim()
    @MaxLength(255, {
        message: "description-too-long"
    })
    description: string;

}

