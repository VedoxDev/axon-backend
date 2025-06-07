import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class RespondInvitationDto {
    @IsNotEmpty()
    @IsString()
    @IsIn(['accept', 'reject'])
    action: 'accept' | 'reject';
} 