import { IsEmail, IsOptional, IsUUID } from "class-validator";
import { RequireOneField } from "../../common/decorators/require-one-field.decorator";

export class InviteMemberDto {
    @IsOptional()
    @IsEmail({}, { message: 'email-invalid' })
    email?: string;

    @IsOptional()
    @IsUUID('4', { message: 'userId-invalid' })
    userId?: string;

    @RequireOneField(['email', 'userId'])
    validationField?: never;
} 