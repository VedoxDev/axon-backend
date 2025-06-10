import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomServiceClient, AccessToken, WebhookReceiver } from 'livekit-server-sdk';
import { Call, CallParticipant, CallType, CallStatus, MeetingType } from './entities/call.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { StartCallDto, JoinCallDto, UpdateCallParticipantDto, ScheduleProjectMeetingDto, SchedulePersonalMeetingDto } from './dto/call.dto';
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
      isConnected: true  // Initiator is connected when starting the call
    });

    await this.participantRepository.save(initiatorParticipant);

    // Debug logging for user data
    this.logger.log(`Initiator user data: id=${initiator.id}, nombre="${initiator.nombre}", apellidos="${initiator.apellidos}", email="${initiator.email}"`);
    
    // Generate access token for initiator
    const displayName = `${initiator.nombre || 'Unknown'} ${initiator.apellidos || 'User'}`.trim();
    const token = await this.generateAccessToken(
      initiator.id,
      roomName,
      displayName,
      true, // canPublish
      true, // canSubscribe
      initiator.email
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
          title,
          audioOnly || false
        );
      } else if (type === CallType.PROJECT && projectId) {
        await this.chatService.sendProjectCallInvitation(
          initiator.id,
          projectId,
          savedCall.id,
          title,
          audioOnly || false
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
        isConnected: true  // Set as connected when joining
      });
      participant = await this.participantRepository.save(participant);
    } else {
      // Update existing participant as connected
      participant.isConnected = true;
      participant.leftAt = undefined; // Clear leftAt if rejoining
      participant = await this.participantRepository.save(participant);
    }

    // Update call status to active if this is the first person joining
    if (call.status === CallStatus.WAITING) {
      call.status = CallStatus.ACTIVE;
      call.startedAt = new Date();
      await this.callRepository.save(call);
    }

    // Debug logging for user data
    this.logger.log(`Join call user data: id=${user.id}, nombre="${user.nombre}", apellidos="${user.apellidos}", email="${user.email}"`);
    
    // Generate access token
    const displayName = `${user.nombre || 'Unknown'} ${user.apellidos || 'User'}`.trim();
    const token = await this.generateAccessToken(
      user.id,
      call.roomName,
      displayName,
      true, // canPublish
      true, // canSubscribe
      user.email
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

    // Reload participants to get the latest state
    const updatedCall = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['participants', 'participants.user']
    });

    if (!updatedCall) {
      throw new NotFoundException('call-not-found-after-update');
    }

    // Check if there are any active participants remaining
    const activeParticipants = updatedCall.participants.filter(p => p.isConnected && !p.leftAt);
    
    this.logger.log(`Active participants remaining after ${user.id} left: ${activeParticipants.length}`);
    activeParticipants.forEach(p => {
      this.logger.log(`  - Participant ${p.user.id} (connected: ${p.isConnected}, leftAt: ${p.leftAt})`);
    });

    if (activeParticipants.length === 0) {
      this.logger.log(`No active participants remaining, ending call ${call.id}`);
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
    } else {
      this.logger.log(`Call ${call.id} continues with ${activeParticipants.length} active participants`);
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
    canSubscribe: boolean = true,
    userEmail?: string,
    userAvatar?: string
  ): Promise<string> {
    // Create metadata with user display information
    const metadata = JSON.stringify({
      displayName: participantName,
      email: userEmail || '',
      avatar: userAvatar || '',
      userId: userId // Keep UUID for backend tracking
    });

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY || 'devkey',
      process.env.LIVEKIT_API_SECRET || 'secret',
      {
        identity: userId, // Keep UUID for internal tracking
        name: participantName, // Display name for compatibility
        metadata: metadata // Rich user data for frontend
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe,
    });

    const token = at.toJwt();
    this.logger.log(`Generated access token for ${participantName} (${userId}) in room ${roomName}`);
    
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

  // ========== MEETINGS ==========

  async scheduleProjectMeeting(organizer: User, scheduleDto: ScheduleProjectMeetingDto): Promise<Call> {
    const { title, scheduledAt, projectId, description, duration, audioOnly, recordCall } = scheduleDto;

    // Verify project exists and user is a member
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user']
    });

    if (!project) {
      throw new NotFoundException('project-not-found');
    }

    // Check if organizer is project member
    const isMember = project.members.some(member => member.user.id === organizer.id);
    if (!isMember) {
      throw new ForbiddenException('not-project-member');
    }

    // Validate scheduled time is in the future
    const meetingTime = new Date(scheduledAt);
    if (meetingTime <= new Date()) {
      throw new BadRequestException('meeting-time-must-be-future');
    }

    // Generate unique room name for the meeting
    const roomName = `meeting_${projectId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create the scheduled meeting
    const meeting = this.callRepository.create({
      roomName,
      type: CallType.PROJECT,
      status: CallStatus.WAITING,
      initiator: organizer,
      project,
      title,
      scheduledAt: meetingTime,
      isScheduledMeeting: true,
      description: description || undefined,
      duration: duration || 60,
      audioOnly: audioOnly || false,
      recordCall: recordCall || false,
      meetingType: MeetingType.PROJECT_MEETING
    });

    const savedMeeting = await this.callRepository.save(meeting);

    this.logger.log(`Project meeting ${savedMeeting.id} scheduled for ${scheduledAt} by ${organizer.id}`);

    return savedMeeting;
  }

  async schedulePersonalMeeting(organizer: User, scheduleDto: SchedulePersonalMeetingDto): Promise<Call> {
    const { title, scheduledAt, participantEmails, description, duration, audioOnly, recordCall } = scheduleDto;

    // Validate scheduled time is in the future
    const meetingTime = new Date(scheduledAt);
    if (meetingTime <= new Date()) {
      throw new BadRequestException('meeting-time-must-be-future');
    }

    // Find users by email
    const participants = await this.userRepository.find({
      where: participantEmails.map(email => ({ email: email.toLowerCase() }))
    });

    if (participants.length === 0) {
      throw new BadRequestException('no-valid-participants-found');
    }

    // Generate unique room name
    const roomName = `personal_meeting_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create the scheduled meeting
    const meeting = this.callRepository.create({
      roomName,
      type: CallType.DIRECT, // Use DIRECT type for personal meetings
      status: CallStatus.WAITING,
      initiator: organizer,
      title,
      scheduledAt: meetingTime,
      isScheduledMeeting: true,
      description: description || undefined,
      duration: duration || 60,
      audioOnly: audioOnly || false,
      recordCall: recordCall || false,
      meetingType: MeetingType.PERSONAL_MEETING
    });

    const savedMeeting = await this.callRepository.save(meeting);

    // Create participant records for invited users
    const participantRecords = participants.map(user => 
      this.participantRepository.create({
        call: savedMeeting,
        user,
        isConnected: false // Not connected yet, just invited
      })
    );

    await this.participantRepository.save(participantRecords);

    this.logger.log(`Personal meeting ${savedMeeting.id} scheduled for ${scheduledAt} by ${organizer.id} with ${participants.length} participants`);

    return savedMeeting;
  }

  async getUserMeetings(user: User): Promise<Call[]> {
    const now = new Date();
    
    return this.callRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.initiator', 'initiator')
      .leftJoinAndSelect('call.project', 'project')
      .leftJoinAndSelect('call.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .leftJoinAndSelect('project.members', 'projectMembers')
      .leftJoinAndSelect('projectMembers.user', 'memberUser')
      .where('call.isScheduledMeeting = :isScheduled', { isScheduled: true })
      .andWhere('call.scheduledAt > :now', { now })
      .andWhere('call.status != :cancelled', { cancelled: CallStatus.CANCELLED })
      .andWhere(
        '(call.initiatorId = :userId OR participants.userId = :userId OR memberUser.id = :userId)',
        { userId: user.id }
      )
      .orderBy('call.scheduledAt', 'ASC')
      .getMany();
  }

  async getProjectMeetings(user: User, projectId: string): Promise<Call[]> {
    // Verify user is project member
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

    const now = new Date();

    return this.callRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.initiator', 'initiator')
      .leftJoinAndSelect('call.project', 'project')
      .leftJoinAndSelect('call.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('call.projectId = :projectId', { projectId })
      .andWhere('call.isScheduledMeeting = :isScheduled', { isScheduled: true })
      .andWhere('call.meetingType = :meetingType', { meetingType: MeetingType.PROJECT_MEETING })
      .andWhere('call.scheduledAt > :now', { now })
      .andWhere('call.status != :cancelled', { cancelled: CallStatus.CANCELLED })
      .orderBy('call.scheduledAt', 'ASC')
      .getMany();
  }

  async getProjectMeetingHistory(user: User, projectId: string): Promise<Call[]> {
    // Verify user is project member
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

    // Return ALL meetings for this project (past and future), excluding cancelled
    return this.callRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.initiator', 'initiator')
      .leftJoinAndSelect('call.project', 'project')  
      .leftJoinAndSelect('call.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('call.projectId = :projectId', { projectId })
      .andWhere('call.isScheduledMeeting = :isScheduled', { isScheduled: true })
      .andWhere('call.meetingType = :meetingType', { meetingType: MeetingType.PROJECT_MEETING })
      .andWhere('call.status != :cancelled', { cancelled: CallStatus.CANCELLED })
      .orderBy('call.scheduledAt', 'DESC') // Most recent first
      .getMany();
  }

  async getMeetingDetails(user: User, meetingId: string): Promise<Call> {
    const meeting = await this.callRepository.findOne({
      where: { id: meetingId, isScheduledMeeting: true },
      relations: ['initiator', 'project', 'participants', 'participants.user', 'project.members', 'project.members.user']
    });

    if (!meeting) {
      throw new NotFoundException('meeting-not-found');
    }

    // Check if user has access to this meeting
    let hasAccess = false;

    if (meeting.initiator.id === user.id) {
      hasAccess = true;
    } else if (meeting.meetingType === MeetingType.PROJECT_MEETING && meeting.project) {
      hasAccess = meeting.project.members.some(member => member.user.id === user.id);
    } else if (meeting.meetingType === MeetingType.PERSONAL_MEETING) {
      hasAccess = meeting.participants.some(participant => participant.user.id === user.id);
    }

    if (!hasAccess) {
      throw new ForbiddenException('no-access-to-meeting');
    }

    return meeting;
  }

  async cancelMeeting(user: User, meetingId: string): Promise<{ message: string }> {
    const meeting = await this.callRepository.findOne({
      where: { id: meetingId, isScheduledMeeting: true },
      relations: ['initiator']
    });

    if (!meeting) {
      throw new NotFoundException('meeting-not-found');
    }

    // Only the organizer can cancel the meeting
    if (meeting.initiator.id !== user.id) {
      throw new ForbiddenException('only-organizer-can-cancel-meeting');
    }

    if (meeting.status === CallStatus.CANCELLED) {
      throw new BadRequestException('meeting-already-cancelled');
    }

    if (meeting.status === CallStatus.ACTIVE || meeting.status === CallStatus.ENDED) {
      throw new BadRequestException('cannot-cancel-active-or-ended-meeting');
    }

    // Cancel the meeting
    meeting.status = CallStatus.CANCELLED;
    await this.callRepository.save(meeting);

    this.logger.log(`Meeting ${meeting.id} cancelled by ${user.id}`);

    return { message: 'meeting-cancelled-successfully' };
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