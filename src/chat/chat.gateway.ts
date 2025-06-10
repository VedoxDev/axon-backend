import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageSocketDto, TypingEventDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, { socketId: string; userId: string }>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {
    // Inject this gateway into the chat service for real-time broadcasting
    this.chatService.setChatGateway(this);
  }

  // ========== CONNECTION MANAGEMENT ==========

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.id;

      if (!userId) {
        this.logger.error(`No user ID found in JWT payload for client ${client.id}:`, payload);
        client.disconnect();
        return;
      }

      // Store user connection
      this.connectedUsers.set(client.id, { socketId: client.id, userId });
      
      // Join user to their personal room
      await client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Notify about online status
      client.broadcast.emit('userOnline', { userId });

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userConnection = this.connectedUsers.get(client.id);
    
    if (userConnection) {
      const { userId } = userConnection;
      this.connectedUsers.delete(client.id);
      
      // Notify about offline status
      client.broadcast.emit('userOffline', { userId });
      
      this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
    }
  }

  // ========== MESSAGING ==========

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageSocketDto,
  ) {
    try {
      const userConnection = this.connectedUsers.get(client.id);
      if (!userConnection) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const { userId } = userConnection;
      const { content, recipientId, projectId } = data;

      // Create message in database
      const message = await this.chatService.createMessageForSocket(
        userId,
        content,
        recipientId,
        projectId,
      );

      // Load full message with relations for broadcasting
      const fullMessage = await this.chatService.getMessageWithRelations(message.id);

      if (!fullMessage) {
        client.emit('error', { message: 'Failed to create message' });
        return;
      }

      // Prepare message data for broadcast
      const messageData = {
        id: fullMessage.id,
        content: fullMessage.content,
        senderId: fullMessage.sender.id,
        senderName: `${fullMessage.sender.nombre} ${fullMessage.sender.apellidos}`,
        createdAt: fullMessage.createdAt,
        isRead: fullMessage.isRead,
        isEdited: fullMessage.isEdited,
        type: recipientId ? 'direct' : 'project',
        recipientId: fullMessage.recipient?.id,
        projectId: fullMessage.project?.id,
      };

      if (recipientId) {
        // Direct message - send to recipient
        this.server.to(`user:${recipientId}`).emit('newMessage', messageData);
        // Also send back to sender for confirmation
        client.emit('messageSent', messageData);
      } else if (projectId) {
        // Project message - broadcast to all project members
        this.server.to(`project:${projectId}`).emit('newMessage', messageData);
        // Send confirmation to sender
        client.emit('messageSent', messageData);
      }

    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('joinProject')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const userConnection = this.connectedUsers.get(client.id);
    if (!userConnection) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    const { projectId } = data;
    
    // Join project room for real-time messages
    await client.join(`project:${projectId}`);
    
    this.logger.log(`User ${userConnection.userId} joined project ${projectId}`);
    client.emit('joinedProject', { projectId });
  }

  @SubscribeMessage('leaveProject')
  async handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const { projectId } = data;
    
    await client.leave(`project:${projectId}`);
    
    const userConnection = this.connectedUsers.get(client.id);
    if (userConnection) {
      this.logger.log(`User ${userConnection.userId} left project ${projectId}`);
    }
    
    client.emit('leftProject', { projectId });
  }

  // ========== TYPING INDICATORS ==========

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingEventDto,
  ) {
    const userConnection = this.connectedUsers.get(client.id);
    if (!userConnection) return;

    const { userId } = userConnection;
    const { recipientId, projectId, typing } = data;

    const typingData = {
      userId,
      typing,
      timestamp: new Date(),
    };

    if (recipientId) {
      // Direct message typing
      this.server.to(`user:${recipientId}`).emit('typing', {
        ...typingData,
        type: 'direct',
      });
    } else if (projectId) {
      // Project typing
      client.to(`project:${projectId}`).emit('typing', {
        ...typingData,
        type: 'project',
        projectId,
      });
    }
  }

  // ========== PRESENCE ==========

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = Array.from(this.connectedUsers.values()).map(
      (connection) => connection.userId,
    );
    
    client.emit('onlineUsers', { users: onlineUsers });
  }

  // Helper method to send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper method to send message to project
  sendToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }
} 