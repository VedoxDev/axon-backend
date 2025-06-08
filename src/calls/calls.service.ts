import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomServiceClient, AccessToken, WebhookReceiver } from 'livekit-server-sdk';
import { Call, CallParticipant, CallType, CallStatus } from './entities/call.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { StartCallDto, JoinCallDto, UpdateCallParticipantDto } from './dto/call.dto';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);
  private roomService: RoomServiceClient;

  constructor(
    @InjectRepository(Call)
    private callRepository: Repository<Call>,
    @InjectRepository(CallParticipant)
    private participantRepository: Repository<CallParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private chatService: ChatService,
  ) {
    // Initialize LiveKit room service
    this.roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL || 'ws://localhost:7880',
      process.env.LIVEKIT_API_KEY || 'devkey',
      process.env.LIVEKIT_API_SECRET || 'secret'
    );
  }

  // ========== CALL MANAGEMENT ==========

  async startCall(initiator: User, startCallDto: StartCallDto): Promise<{ call: Call; token: string }> {
    const { type, recipientId, projectId, title, audioOnly, recordCall, maxParticipants } = startCallDto;

    // Validate call type and participants
    if (type === CallType.DIRECT) {
      if (!recipientId) {
        throw new BadRequestException('recipient-id-required-for-direct-call');
      }
      if (recipientId === initiator.id) {
        throw new BadRequestException('cannot-call-yourself');
      }
    } else if (type === CallType.PROJECT) {
      if (!projectId) {
        throw new BadRequestException('project-id-required-for-project-call');
      }
    }

    let recipient: User | undefined;
    let project: Project | undefined;

    if (recipientId) {
      recipient = await this.userRepository.findOne({ where: { id: recipientId } }) || undefined;
      if (!recipient) {
        throw new NotFoundException('recipient-not-found');
      }
    }

    if (projectId) {
      project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['members', 'members.user']
      }) || undefined;

      if (!project) {
        throw new NotFoundException('project-not-found');
      }

      const isMember = project.members.some(member => member.user.id === initiator.id);
      if (!isMember) {
        throw new ForbiddenException('not-project-member');
      }
    }

    // Generate unique room name
    const roomName = `call_${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create LiveKit room
    try {
      await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: 60, // Close room after 1 minute if empty
        maxParticipants: maxParticipants || 0, // 0 = unlimited
      });

      this.logger.log(`Created LiveKit room: ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to create LiveKit room: ${error.message}`);
      throw new BadRequestException('failed-to-create-room');
    }

    // Create call record
    const call = this.callRepository.create({
      roomName,
      type,
      status: CallStatus.WAITING,
      initiator,
      recipient,
      project,
      title,
      audioOnly: audioOnly || false,
      recordCall: recordCall || false,
      maxParticipants: maxParticipants || 0,
    });

    const savedCall = await this.callRepository.save(call);

    // Create participant record for initiator
    const initiatorParticipant = this.participantRepository.create({
      call: savedCall,
      user: initiator,
      isConnected: false
    });

    await this.participantRepository.save(initiatorParticipant);

    // Generate access token for initiator
    const token = await this.generateAccessToken(
      initiator.id,
      roomName,
      `${initiator.nombre} ${initiator.apellidos}`,
      true, // canPublish
      true  // canSubscribe
    );

    this.logger.log(`Call ${savedCall.id} started by ${initiator.id} in room ${roomName}`);

    // Send chat invitation
    try {
      if (type === CallType.DIRECT && recipientId) {
        await this.chatService.sendCallInvitation(
          initiator.id,
          recipientId,
          savedCall.id,
          'direct',
          title
        );
      } else if (type === CallType.PROJECT && projectId) {
        await this.chatService.sendProjectCallInvitation(
          initiator.id,
          projectId,
          savedCall.id,
          title
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send call invitation: ${error.message}`);
      // Don't fail the call creation if chat invitation fails
    }

    return { call: savedCall, token };
  }

  async joinCall(user: User, callId: string, audioOnly: boolean = false): Promise<{ call: Call; token: string }> {
    // Find call
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['initiator', 'recipient', 'project', 'project.members', 'project.members.user', 'participants', 'participants.user']
    });

    if (!call) {
      throw new NotFoundException('call-not-found');
    }

    if (call.status === CallStatus.ENDED || call.status === CallStatus.CANCELLED) {
      throw new BadRequestException('call-has-ended');
    }

    // Check permissions
    if (call.type === CallType.DIRECT) {
      // For direct calls, only initiator and recipient can join
      if (user.id !== call.initiator.id && (!call.recipient || user.id !== call.recipient.id)) {
        throw new ForbiddenException('not-authorized-to-join-call');
      }
    } else if (call.type === CallType.PROJECT) {
      // For project calls, only project members can join
      if (!call.project) {
        throw new BadRequestException('project-call-missing-project');
      }
      
      const isMember = call.project.members.some(member => member.user.id === user.id);
      if (!isMember) {
        throw new ForbiddenException('not-project-member');
      }
    }

    // Check if user is already in call
    let participant = call.participants.find(p => p.user.id === user.id);
    
    if (!participant) {
      // Create new participant
      participant = this.participantRepository.create({
        call,
        user,
        isConnected: false
      });
      participant = await this.participantRepository.save(participant);
    }

    // Update call status to active if this is the first person joining
    if (call.status === CallStatus.WAITING) {
      call.status = CallStatus.ACTIVE;
      call.startedAt = new Date();
      await this.callRepository.save(call);
    }

    // Generate access token
    const token = await this.generateAccessToken(
      user.id,
      call.roomName,
      `${user.nombre} ${user.apellidos}`,
      true, // canPublish
      true  // canSubscribe
    );

    this.logger.log(`User ${user.id} joined call ${call.id}`);

    return { call, token };
  }

  async leaveCall(user: User, callId: string): Promise<{ message: string }> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['participants', 'participants.user']
    });

    if (!call) {
      throw new NotFoundException('call-not-found');
    }

    const participant = call.participants.find(p => p.user.id === user.id);
    if (!participant) {
      throw new BadRequestException('not-in-call');
    }

    // Update participant
    participant.leftAt = new Date();
    participant.isConnected = false;
    await this.participantRepository.save(participant);

    // If this was the last participant, end the call
    const activeParticipants = call.participants.filter(p => p.isConnected && !p.leftAt);
    if (activeParticipants.length === 0) {
      call.status = CallStatus.ENDED;
      call.endedAt = new Date();
      await this.callRepository.save(call);

      // Delete LiveKit room
      try {
        await this.roomService.deleteRoom(call.roomName);
        this.logger.log(`Deleted empty LiveKit room: ${call.roomName}`);
      } catch (error) {
        this.logger.error(`Failed to delete room ${call.roomName}: ${error.message}`);
      }
    }

    this.logger.log(`User ${user.id} left call ${call.id}`);

    return { message: 'left-call-successfully' };
  }

  async endCall(user: User, callId: string): Promise<{ message: string }> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['initiator', 'participants']
    });

    if (!call) {
      throw new NotFoundException('call-not-found');
    }

    // Only initiator can end the call
    if (call.initiator.id !== user.id) {
      throw new ForbiddenException('only-initiator-can-end-call');
    }

    if (call.status === CallStatus.ENDED || call.status === CallStatus.CANCELLED) {
      throw new BadRequestException('call-already-ended');
    }

    // End call
    call.status = CallStatus.ENDED;
    call.endedAt = new Date();
    await this.callRepository.save(call);

    // Update all participants
    await this.participantRepository.update(
      { call: { id: callId }, leftAt: undefined },
      { leftAt: new Date(), isConnected: false }
    );

    // Delete LiveKit room
    try {
      await this.roomService.deleteRoom(call.roomName);
      this.logger.log(`Deleted LiveKit room: ${call.roomName}`);
    } catch (error) {
      this.logger.error(`Failed to delete room ${call.roomName}: ${error.message}`);
    }

    this.logger.log(`Call ${call.id} ended by ${user.id}`);

    return { message: 'call-ended-successfully' };
  }

  async getUserActiveCalls(user: User): Promise<Call[]> {
    return this.callRepository.find({
      where: [
        { initiator: { id: user.id }, status: CallStatus.ACTIVE },
        { recipient: { id: user.id }, status: CallStatus.ACTIVE },
        { participants: { user: { id: user.id }, isConnected: true } }
      ],
      relations: ['initiator', 'recipient', 'project', 'participants', 'participants.user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getCallHistory(user: User, page: number = 1, limit: number = 20): Promise<Call[]> {
    return this.callRepository.find({
      where: [
        { initiator: { id: user.id } },
        { recipient: { id: user.id } },
        { participants: { user: { id: user.id } } }
      ],
      relations: ['initiator', 'recipient', 'project', 'participants', 'participants.user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });
  }

  // ========== LIVEKIT INTEGRATION ==========

  async generateAccessToken(
    userId: string,
    roomName: string,
    participantName: string,
    canPublish: boolean = true,
    canSubscribe: boolean = true
  ): Promise<string> {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY || 'devkey',
      process.env.LIVEKIT_API_SECRET || 'secret',
      {
        identity: userId,
        name: participantName,
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe,
    });

    const token = at.toJwt();
    this.logger.log(`Generated access token for user ${userId} in room ${roomName}`);
    
    return token;
  }

  async updateParticipantState(
    user: User,
    callId: string,
    updateDto: UpdateCallParticipantDto
  ): Promise<CallParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { call: { id: callId }, user: { id: user.id } },
      relations: ['call', 'user']
    });

    if (!participant) {
      throw new NotFoundException('participant-not-found');
    }

    if (updateDto.micMuted !== undefined) {
      participant.micMuted = updateDto.micMuted;
    }

    if (updateDto.videoMuted !== undefined) {
      participant.videoMuted = updateDto.videoMuted;
    }

    return this.participantRepository.save(participant);
  }

  // ========== WEBHOOKS ==========

  async handleLiveKitWebhook(body: any, authHeader: string): Promise<void> {
    try {
      const receiver = new WebhookReceiver(
        process.env.LIVEKIT_API_KEY || 'devkey',
        process.env.LIVEKIT_API_SECRET || 'secret'
      );

      const event = await receiver.receive(body, authHeader);
      
      switch ((event as any).event) {
        case 'participant_joined':
          await this.handleParticipantJoined((event as any).participant, (event as any).room);
          break;
        case 'participant_left':
          await this.handleParticipantLeft((event as any).participant, (event as any).room);
          break;
        case 'room_finished':
          await this.handleRoomFinished((event as any).room);
          break;
      }
    } catch (error) {
      this.logger.error(`LiveKit webhook error: ${error.message}`);
      throw error;
    }
  }

  private async handleParticipantJoined(participant: any, room: any): Promise<void> {
    const callParticipant = await this.participantRepository.findOne({
      where: { call: { roomName: room.name }, user: { id: participant.identity } },
      relations: ['call']
    });

    if (callParticipant) {
      callParticipant.joinedAt = new Date();
      callParticipant.isConnected = true;
      await this.participantRepository.save(callParticipant);
      
      this.logger.log(`Participant ${participant.identity} joined room ${room.name}`);
    }
  }

  private async handleParticipantLeft(participant: any, room: any): Promise<void> {
    const callParticipant = await this.participantRepository.findOne({
      where: { call: { roomName: room.name }, user: { id: participant.identity } },
      relations: ['call']
    });

    if (callParticipant) {
      callParticipant.leftAt = new Date();
      callParticipant.isConnected = false;
      await this.participantRepository.save(callParticipant);
      
      this.logger.log(`Participant ${participant.identity} left room ${room.name}`);
    }
  }

  private async handleRoomFinished(room: any): Promise<void> {
    const call = await this.callRepository.findOne({
      where: { roomName: room.name }
    });

    if (call && call.status !== CallStatus.ENDED) {
      call.status = CallStatus.ENDED;
      call.endedAt = new Date();
      await this.callRepository.save(call);
      
      this.logger.log(`Room ${room.name} finished, call ${call.id} marked as ended`);
    }
  }

  // ========== DEBUG METHODS ==========

  async debugFindCall(callId: string): Promise<Call | null> {
    this.logger.log(`[DEBUG] Searching for call with ID: "${callId}"`);
    return this.callRepository.findOne({
      where: { id: callId },
      relations: ['initiator', 'recipient', 'project']
    });
  }
} 