import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { CreateMessageDto, UpdateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ========== CONVERSATION MANAGEMENT ==========

  @Get('conversations')
  async getUserConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user);
  }

  // ========== DIRECT MESSAGES ==========

  @Get('direct/:userId')
  async getDirectMessages(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.chatService.getDirectMessages(req.user, userId, page, limit);
  }

  @Put('direct/:userId/read')
  async markDirectConversationAsRead(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.chatService.markDirectConversationAsRead(req.user, userId);
  }

  // ========== PROJECT MESSAGES ==========

  @Get('project/:projectId')
  async getProjectMessages(
    @Request() req,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.chatService.getProjectMessages(req.user, projectId, page, limit);
  }

  // ========== MESSAGE OPERATIONS ==========

  @Post('messages')
  async createMessage(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.chatService.createMessage(req.user, createMessageDto);
  }

  @Put('messages/:messageId')
  async updateMessage(
    @Request() req,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.chatService.updateMessage(req.user, messageId, updateMessageDto);
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Request() req,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.chatService.deleteMessage(req.user, messageId);
  }

  @Put('messages/:messageId/read')
  async markMessageAsRead(
    @Request() req,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.chatService.markMessageAsRead(req.user, messageId);
  }

  // ========== SEARCH ==========

  @Get('search')
  async searchMessages(
    @Request() req,
    @Query('q') query: string,
    @Query('projectId') projectId?: string,
    @Query('userId') userId?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    // This is a simple implementation - you could make it more sophisticated
    if (projectId) {
      const messages = await this.chatService.getProjectMessages(req.user, projectId, page, limit);
      return messages.filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      );
    } else if (userId) {
      const messages = await this.chatService.getDirectMessages(req.user, userId, page, limit);
      return messages.filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Search across all user's conversations (could be expensive for large datasets)
    const conversations = await this.chatService.getUserConversations(req.user);
    const searchResults: any[] = [];

    // This is simplified - in a real app you'd want a proper full-text search
    for (const conversation of conversations) {
      if (conversation.type === 'direct' && conversation.partner) {
        const messages = await this.chatService.getDirectMessages(req.user, conversation.partner.id, 1, 100);
        const matches = messages.filter(message => 
          message.content.toLowerCase().includes(query.toLowerCase())
        );
        searchResults.push(...matches);
      } else if (conversation.type === 'project' && conversation.project) {
        const messages = await this.chatService.getProjectMessages(req.user, conversation.project.id, 1, 100);
        const matches = messages.filter(message => 
          message.content.toLowerCase().includes(query.toLowerCase())
        );
        searchResults.push(...matches);
      }
    }

    return searchResults
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * limit, page * limit);
  }
} 