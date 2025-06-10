import { IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, IsEnum, IsNumber, Min, Max, IsDateString, IsArray, IsEmail } from 'class-validator';
import { CallType, MeetingType } from '../entities/call.entity';

export class StartCallDto {
  @IsEnum(CallType)
  type: CallType;

  // For direct calls
  @IsOptional()
  @IsUUID('4', { message: 'invalid-recipient-id' })
  recipientId?: string;

  // For project calls
  @IsOptional()
  @IsUUID('4', { message: 'invalid-project-id' })
  projectId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  audioOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  recordCall?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(100)
  maxParticipants?: number;
}

export class JoinCallDto {
  @IsOptional()
  @IsBoolean()
  audioOnly?: boolean;
}

export class UpdateCallParticipantDto {
  @IsOptional()
  @IsBoolean()
  micMuted?: boolean;

  @IsOptional()
  @IsBoolean()
  videoMuted?: boolean;
}

export class CallInvitationDto {
  @IsNotEmpty()
  @IsString()
  callId: string;

  @IsNotEmpty()
  @IsString()
  callType: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsString()
  initiatorName: string;
}

export class LiveKitTokenDto {
  @IsNotEmpty()
  @IsString()
  roomName: string;

  @IsNotEmpty()
  @IsString()
  participantName: string;

  @IsOptional()
  @IsBoolean()
  canPublish?: boolean;

  @IsOptional()
  @IsBoolean()
  canSubscribe?: boolean;
}

// Meeting DTOs
export class ScheduleProjectMeetingDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string; // ISO date string

  @IsNotEmpty()
  @IsUUID('4', { message: 'invalid-project-id' })
  projectId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480) // Max 8 hours
  duration?: number; // Duration in minutes

  @IsOptional()
  @IsBoolean()
  audioOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  recordCall?: boolean;
}

export class SchedulePersonalMeetingDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string; // ISO date string

  @IsNotEmpty()
  @IsArray()
  @IsEmail({}, { each: true })
  participantEmails: string[]; // Array of email addresses

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480) // Max 8 hours
  duration?: number; // Duration in minutes

  @IsOptional()
  @IsBoolean()
  audioOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  recordCall?: boolean;
} 