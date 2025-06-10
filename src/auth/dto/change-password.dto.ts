import { IsNotEmpty, MinLength, MaxLength, Matches } from "class-validator";
import { SkipGlobalValidation } from "src/common/decorators/skip-validation.decorator";

@SkipGlobalValidation()
export class ChangePasswordDto {
    @IsNotEmpty({ message: "current-password-required" })
    currentPassword: string;

    @IsNotEmpty({ message: "new-password-required" })
    @MinLength(8, { message: "new-password-too-short" })
    @MaxLength(64, { message: "new-password-too-long" })
    @Matches(/(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])/, {
        message: "new-password-too-weak (needs uppercase, number, symbol)",
    })
    @Matches(/^[A-Za-zñÑ\d@$!%*?&.]+$/, {
        message: "new-password-invalid-characters",
    })
    newPassword: string;

    @IsNotEmpty({ message: "confirm-password-required" })
    confirmPassword: string;
} 