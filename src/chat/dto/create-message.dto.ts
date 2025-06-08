import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: 'content-required' })
  @IsString()
  content: string;

  // For direct messages (1:1)
  @IsOptional()
  @IsUUID('4', { message: 'invalid-recipient-id' })
  recipientId?: string;

  // For project conversations
  @IsOptional()
  @IsUUID('4', { message: 'invalid-project-id' })
  projectId?: string;

  // For call invitation messages
  @IsOptional()
  @IsUUID('4', { message: 'invalid-call-id' })
  callId?: string;


}

export class UpdateMessageDto {
  @IsString()
  content: string;
}

// WebSocket message DTOs
export class SendMessageSocketDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID('4')
  recipientId?: string;

  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @IsOptional()
  @IsUUID('4')
  callId?: string;
}

export class TypingEventDto {
  @IsOptional()
  @IsUUID('4')
  recipientId?: string;

  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @IsNotEmpty()
  typing: boolean;
} 