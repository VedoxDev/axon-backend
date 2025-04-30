import { Trim } from "class-sanitizer";
import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    
    //  EMAIL
    @Trim()
    @IsNotEmpty({ message: "email-required"})
    @MaxLength(254, { message: "email-too-long"})
    @IsEmail()
    email: string;

    //  NAME
    @Trim()
    @IsNotEmpty({ message: "nombre-required" })
    @Matches(/^[A-Za-zñÑáéíóúÁÉÍÓÚ\s]+$/, {
        message: "nombre-invalid-characters",
    })
    @MinLength(2, { message: "nombre-too-short" })
    @MaxLength(60, { message: "nombre-too-long" })
    nombre: string;

    //  SURNAME
    @Trim()
    @IsNotEmpty({ message: "apellidos-required" })
    @Matches(/^[A-Za-zñÑáéíóúÁÉÍÓÚ\s]+$/, {
        message: "apellidos-invalid-characters",
    })
    @MinLength(2, { message: "apellidos-too-short" })
    @MaxLength(80, { message: "apellidos-too-long" })
    apellidos: string;

    //  PASSWORD
    @IsNotEmpty({ message: "password-required" })
    @MinLength(8, { message: "password-too-short" })
    @MaxLength(64, { message: "password-too-long" })
    @Matches(/(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])/, {
        message: "password-too-weak (needs uppercase, number, symbol)",
    })
    @Matches(/^[A-Za-zñÑ\d@$!%*?&.]+$/, {
        message: "password-invalid-characters",
    })
    password: string;
}
