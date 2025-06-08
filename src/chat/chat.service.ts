import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateMessageDto, UpdateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  // ========== MESSAGE OPERATIONS ==========

  async createMessage(sender: User, createMessageDto: CreateMessageDto): Promise<Message> {
    const { content, recipientId, projectId } = createMessageDto;

    console.log(`[ChatService] Creating message from user ${sender.id} to ${recipientId || `project ${projectId}`}`);

    // Validate that either recipient or project is provided, not both
    if ((!recipientId && !projectId) || (recipientId && projectId)) {
      throw new BadRequestException('Either recipientId or projectId must be provided, but not both');
    }

    let recipient: User | undefined;
    let project: Project | undefined;

    if (recipientId) {
      // Direct message - verify recipient exists
      recipient = await this.userRepository.findOne({ where: { id: recipientId } }) || undefined;
      if (!recipient) {
        throw new NotFoundException('recipient-not-found');
      }

      // Can't send message to yourself
      if (recipient.id === sender.id) {
        console.log(`[ChatService] ERROR: User ${sender.id} tried to message themselves (recipient: ${recipient.id})`);
        throw new BadRequestException('cannot-message-yourself');
      }
    }

    if (projectId) {
      // Project message - verify user is member
      project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['members', 'members.user']
      }) || undefined;

      if (!project) {
        throw new NotFoundException('project-not-found');
      }

      const isMember = project.members.some(member => member.user.id === sender.id);
      if (!isMember) {
        throw new ForbiddenException('not-project-member');
      }
    }

    // Create message
    const message = this.messageRepository.create({
      content,
      sender,
      recipient,
      project,
      callId: createMessageDto.callId,
      isRead: false,
      isEdited: false
    });

    return this.messageRepository.save(message);
  }

  async getDirectMessages(user: User, otherUserId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    // Verify other user exists
    const otherUser = await this.userRepository.findOne({ where: { id: otherUserId } });
    if (!otherUser) {
      throw new NotFoundException('user-not-found');
    }

    // Get messages between the two users
    const messages = await this.messageRepository.find({
      where: [
        { sender: { id: user.id }, recipient: { id: otherUserId } },
        { sender: { id: otherUserId }, recipient: { id: user.id } }
      ],
      relations: ['sender', 'recipient'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });

    return messages.reverse(); // Return in chronological order
  }

  async getProjectMessages(user: User, projectId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    // Verify user has access to project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user']
    });

    if (!project) {
      throw new NotFoundException('project-not-found');
    }

    const isMember = project.members.some(member => member.user.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('not-project-member');
    }

    // Get project messages
    const messages = await this.messageRepository.find({
      where: { project: { id: projectId } },
      relations: ['sender', 'project'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });

    return messages.reverse(); // Return in chronological order
  }

  async getUserConversations(user: User): Promise<any[]> {
    // Get recent direct message conversations
    const directMessages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .where('message.senderId = :userId OR message.recipientId = :userId', { userId: user.id })
      .andWhere('message.recipient IS NOT NULL') // Only direct messages
      .andWhere('message.sender IS NOT NULL') // Ensure sender exists
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    // Group by conversation partner and get latest message
    const conversationMap = new Map();
    
    directMessages.forEach(message => {
      // Skip messages with missing sender or recipient data
      if (!message.sender || !message.recipient) {
        console.log(`[ChatService] Skipping message ${message.id} with missing sender/recipient data`);
        return;
      }

      const partnerId = message.sender.id === user.id ? message.recipient.id : message.sender.id;
      const partner = message.sender.id === user.id ? message.recipient : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          type: 'direct',
          partner: {
            id: partner.id,
            nombre: partner.nombre,
            apellidos: partner.apellidos,
            status: partner.status
          },
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.sender.id,
            createdAt: message.createdAt,
            isRead: message.isRead
          }
        });
      }
    });

    // Get project conversations (projects where user is member)
    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getMany();

    const projectConversations = await Promise.all(
      projects.map(async (project) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { project: { id: project.id } },
          relations: ['sender'],
          order: { createdAt: 'DESC' }
        });

        return {
          type: 'project',
          project: {
            id: project.id,
            name: project.name,
            description: project.description
          },
          lastMessage: lastMessage && lastMessage.sender ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.sender.id,
            senderName: `${lastMessage.sender.nombre} ${lastMessage.sender.apellidos}`,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead
          } : null
        };
      })
    );

    // Combine and sort by latest activity
    const allConversations = [
      ...Array.from(conversationMap.values()),
      ...projectConversations
    ];

    return allConversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || new Date(0);
      const bTime = b.lastMessage?.createdAt || new Date(0);
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  async updateMessage(user: User, messageId: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender']
    });

    if (!message) {
      throw new NotFoundException('message-not-found');
    }

    // Only sender can edit their message
    if (message.sender.id !== user.id) {
      throw new ForbiddenException('not-message-sender');
    }

    message.content = updateMessageDto.content;
    message.isEdited = true;

    return this.messageRepository.save(message);
  }

  async deleteMessage(user: User, messageId: string): Promise<{ message: string }> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender']
    });

    if (!message) {
      throw new NotFoundException('message-not-found');
    }

    // Only sender can delete their message
    if (message.sender.id !== user.id) {
      throw new ForbiddenException('not-message-sender');
    }

    await this.messageRepository.remove(message);

    return { message: 'message-deleted-successfully' };
  }

  async markMessageAsRead(user: User, messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'recipient']
    });

    if (!message) {
      throw new NotFoundException('message-not-found');
    }

    // Only recipient can mark as read (for direct messages)
    if (message.recipient && message.recipient.id !== user.id) {
      throw new ForbiddenException('not-message-recipient');
    }

    // For project messages, any project member can mark as read
    if (message.project) {
      const project = await this.projectRepository.findOne({
        where: { id: message.project.id },
        relations: ['members', 'members.user']
      });

      const isMember = project?.members.some(member => member.user.id === user.id);
      if (!isMember) {
        throw new ForbiddenException('not-project-member');
      }
    }

    message.isRead = true;
    return this.messageRepository.save(message);
  }

  async markDirectConversationAsRead(user: User, otherUserId: string): Promise<{ message: string, markedCount: number }> {
    // Verify other user exists
    const otherUser = await this.userRepository.findOne({ where: { id: otherUserId } });
    if (!otherUser) {
      throw new NotFoundException('user-not-found');
    }

    // Mark as read all messages sent TO current user FROM the other user
    const result = await this.messageRepository.update(
      {
        sender: { id: otherUserId },      // Messages FROM the other user
        recipient: { id: user.id },       // Messages TO current user
        isRead: false                     // Only unread messages
      },
      {
        isRead: true
      }
    );

    console.log(`[ChatService] Marked ${result.affected || 0} messages as read in conversation between ${user.id} and ${otherUserId}`);

    return {
      message: 'messages-marked-as-read',
      markedCount: result.affected || 0
    };
  }

  // Helper method for WebSocket - create message with sender object
  async createMessageForSocket(senderId: string, content: string, recipientId?: string, projectId?: string, callId?: string): Promise<Message> {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('sender-not-found');
    }

    return this.createMessage(sender, { content, recipientId, projectId, callId });
  }

  // Public method for WebSocket gateway to access message repository
  async getMessageWithRelations(messageId: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'recipient', 'project'],
    });
  }

  // ========== CALL INTEGRATION ==========

  async sendCallInvitation(
    senderId: string,
    recipientId: string,
    callId: string,
    callType: 'direct' | 'project',
    title?: string
  ): Promise<Message> {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('sender-not-found');
    }

    const callInviteContent = {
      type: 'call_invitation',
      callId,
      callType,
      title: title || `${callType === 'direct' ? 'Video call' : 'Project call'}`,
      initiatorName: `${sender.nombre} ${sender.apellidos}`
    };

    // Create special call invitation message
    return this.createMessage(sender, {
      content: `📞 ${callInviteContent.initiatorName} invited you to a ${callInviteContent.title}`,
      recipientId,
      callId, // Include the call ID for frontend extraction
    });
  }

  async sendProjectCallInvitation(
    senderId: string,
    projectId: string,
    callId: string,
    title?: string
  ): Promise<Message> {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('sender-not-found');
    }

    const callInviteContent = {
      type: 'call_invitation',
      callId,
      callType: 'project',
      title: title || 'Project video call',
      initiatorName: `${sender.nombre} ${sender.apellidos}`
    };

    // Create project call invitation message
    return this.createMessage(sender, {
      content: `📞 ${callInviteContent.initiatorName} started a ${callInviteContent.title}. Join now!`,
      projectId,
      callId, // Include the call ID for frontend extraction
    });
  }
} 