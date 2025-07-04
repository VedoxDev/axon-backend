import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PlainObjectToNewEntityTransformer } from 'typeorm/query-builder/transformer/PlainObjectToNewEntityTransformer';
import { plainToInstance } from 'class-transformer';
import { UserProfileDto } from './dto/user-profile.dto';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { Message } from '../chat/entities/message.entity';
import { CallParticipant } from '../calls/entities/call.entity';
import { ProjectInvitation } from '../projects/entities/project-invitation.entity';

@Injectable()
export class UsersService {

    
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(ProjectMember) private projectMemberRepository: Repository<ProjectMember>,
        @InjectRepository(Task) private taskRepository: Repository<Task>,
        @InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectRepository(CallParticipant) private callParticipantRepository: Repository<CallParticipant>,
        @InjectRepository(ProjectInvitation) private projectInvitationRepository: Repository<ProjectInvitation>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.findByEmail(createUserDto.email);

        if (existingUser) {
            throw new BadRequestException('email-already-exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword
        });

        return this.userRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: {email: email.toLowerCase()} });
    }

    async findById(userId: string) {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async getProfile(userId: string): Promise<UserProfileDto> {
        const user = await this.findById(userId);
        
        if (!user) {
            throw new NotFoundException("user-not-found");
        }

        return plainToInstance(UserProfileDto, user, { excludeExtraneousValues: true });
    }

    async getUserProfile(userId: string) {
        const user = await this.userRepository.findOne({ 
            where: { id: userId },
            relations: ['memberships', 'memberships.project']
        });

        if (!user) {
            throw new NotFoundException('user-not-found');
        }

        // Parallel queries for performance
        const [
            // Project statistics
            projects,
            
            // Task statistics  
            tasksCreated,
            tasksAssigned,
            tasksCompleted,
            tasksPending,
            tasksInProgress,
            
            // Communication statistics
            messagesSent,
            directConversations,
            
            // Call statistics
            callsParticipated,
            callsInitiated,
            
            // Invitation statistics
            invitationsSent,
            invitationsReceived,
            invitationsAccepted,
            invitationsPending,
            
            // Recent activity
            recentTasks,
            recentMessages,
            recentCalls
        ] = await Promise.all([
            // Project data
            this.projectMemberRepository.find({
                where: { user: { id: userId } },
                relations: ['project']
            }),
            
            // Task statistics
            this.taskRepository.count({ 
                where: { createdBy: { id: userId } } 
            }),
            this.taskRepository
                .createQueryBuilder('task')
                .leftJoin('task.assignees', 'assignee')
                .where('assignee.id = :userId', { userId })
                .getCount(),
            this.taskRepository
                .createQueryBuilder('task')
                .leftJoin('task.assignees', 'assignee')
                .where('assignee.id = :userId', { userId })
                .andWhere('task.status = :status', { status: 'done' })
                .getCount(),
            this.taskRepository
                .createQueryBuilder('task')
                .leftJoin('task.assignees', 'assignee')
                .where('assignee.id = :userId', { userId })
                .andWhere('task.status = :status', { status: 'todo' })
                .getCount(),
            this.taskRepository
                .createQueryBuilder('task')
                .leftJoin('task.assignees', 'assignee')
                .where('assignee.id = :userId', { userId })
                .andWhere('task.status = :status', { status: 'in_progress' })
                .getCount(),
            
            // Message statistics
            this.messageRepository.count({ 
                where: { sender: { id: userId } } 
            }),
            this.messageRepository
                .createQueryBuilder('message')
                .select('COUNT(DISTINCT CASE WHEN message.senderId = :userId THEN message.recipientId ELSE message.senderId END)', 'count')
                .where('(message.senderId = :userId OR message.recipientId = :userId)')
                .andWhere('message.recipient IS NOT NULL')
                .setParameter('userId', userId)
                .getRawOne(),
            
            // Call statistics
            this.callParticipantRepository.count({ 
                where: { user: { id: userId } } 
            }),
            this.callParticipantRepository
                .createQueryBuilder('participant')
                .leftJoin('participant.call', 'call')
                .where('call.initiatorId = :userId', { userId })
                .getCount(),
            
            // Invitation statistics
            this.projectInvitationRepository.count({ 
                where: { inviterUser: { id: userId } } 
            }),
            this.projectInvitationRepository.count({ 
                where: { invitedUser: { id: userId } } 
            }),
            this.projectInvitationRepository.count({ 
                where: { invitedUser: { id: userId }, status: 'accepted' } 
            }),
            this.projectInvitationRepository.count({ 
                where: { invitedUser: { id: userId }, status: 'pending' } 
            }),
            
            // Recent activity (last 10 items each)
            this.taskRepository.find({
                where: [
                    { createdBy: { id: userId } },
                    { assignees: { id: userId } }
                ],
                relations: ['project', 'assignees', 'createdBy'],
                order: { updatedAt: 'DESC' },
                take: 10
            }),
            this.messageRepository.find({
                where: { sender: { id: userId } },
                relations: ['recipient', 'project'],
                order: { createdAt: 'DESC' },
                take: 10
            }),
            this.callParticipantRepository.find({
                where: { user: { id: userId } },
                relations: ['call', 'call.initiator', 'call.project'],
                order: { createdAt: 'DESC' },
                take: 5
            })
        ]);

        // Calculate statistics
        const stats = {
            // Project involvement
            totalProjects: projects.length,
            ownerProjects: projects.filter(p => p.role === 'owner').length,
            adminProjects: projects.filter(p => p.role === 'admin').length,
            memberProjects: projects.filter(p => p.role === 'member').length,
            
            // Task performance
            tasksCreated,
            tasksAssigned,
            tasksCompleted,
            tasksPending,
            tasksInProgress,
            completionRate: tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0,
            
            // Communication activity
            messagesSent,
            directConversations: parseInt(directConversations?.count || '0'),
            
            // Call engagement
            callsParticipated,
            callsInitiated,
            
            // Networking
            invitationsSent,
            invitationsReceived,
            invitationsAccepted,
            invitationsPending,
            invitationAcceptanceRate: invitationsReceived > 0 ? Math.round((invitationsAccepted / invitationsReceived) * 100) : 0
        };

        // Recent activity timeline
        const recentActivity = [
            ...recentTasks
                .filter(task => task.createdBy) // Filter out tasks with null createdBy
                .map(task => ({
                    type: 'task',
                    action: task.createdBy.id === userId ? 'created' : 'assigned',
                    title: task.title,
                    project: task.project?.name,
                    timestamp: task.updatedAt,
                    status: task.status
                })),
            ...recentMessages
                .filter(msg => msg.content) // Filter out messages with null content
                .map(msg => ({
                    type: 'message',
                    action: 'sent',
                    title: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
                    project: msg.project?.name,
                    recipient: msg.recipient ? `${msg.recipient.nombre} ${msg.recipient.apellidos}` : null,
                    timestamp: msg.createdAt
                })),
            ...recentCalls
                .filter(call => call.call && call.call.initiator) // Filter out null calls
                .map(call => ({
                    type: 'call',
                    action: call.call.initiator.id === userId ? 'initiated' : 'joined',
                    title: call.call.title || `${call.call.type} call`,
                    project: call.call.project?.name,
                    timestamp: call.createdAt
                }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

        // Most active projects
        const projectActivity = projects.map(p => ({
            id: p.project.id,
            name: p.project.name,
            role: p.role,
            taskCount: recentTasks.filter(t => t.project?.id === p.project.id).length,
            messageCount: recentMessages.filter(m => m.project?.id === p.project.id).length
        })).sort((a, b) => (b.taskCount + b.messageCount) - (a.taskCount + a.messageCount));

        return {
            // Basic user info
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellidos: user.apellidos,
            fullName: `${user.nombre} ${user.apellidos}`,
            status: user.status,
            memberSince: user.createdAt,
            lastActive: user.updatedAt,
            
            // Aggregated statistics
            stats,
            
            // Recent activity
            recentActivity: recentActivity.slice(0, 15),
            
            // Project breakdown
            projects: projectActivity.slice(0, 5),
            
            // Quick insights
            insights: {
                mostActiveProject: projectActivity[0]?.name || null,
                averageTasksPerProject: projects.length > 0 ? Math.round(tasksCreated / projects.length) : 0,
                peakActivityType: stats.messagesSent > stats.tasksCreated ? 'communication' : 'task_management',
                collaborationScore: Math.min(100, stats.directConversations * 5 + stats.callsParticipated * 10),
                leadershipScore: stats.ownerProjects * 20 + stats.adminProjects * 10 + stats.invitationsSent * 2
            }
        };
    }

    async searchUsers(query: string, limit: number = 10) {
        // Sanitize the query to prevent SQL injection
        const sanitizedQuery = query.trim();
        
        if (sanitizedQuery.length < 2) {
            return [];
        }

        // Use QueryBuilder for more efficient search with CONCAT for full name search
        const users = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.nombre', 
                'user.apellidos', 
                'user.email', 
                'user.status'
            ])
            .where(
                'LOWER(user.nombre) LIKE LOWER(:query) OR ' +
                'LOWER(user.apellidos) LIKE LOWER(:query) OR ' +
                'LOWER(user.email) LIKE LOWER(:query) OR ' +
                'LOWER(CONCAT(user.nombre, \' \', user.apellidos)) LIKE LOWER(:query)',
                { query: `%${sanitizedQuery}%` }
            )
            .orderBy('user.nombre', 'ASC')
            .addOrderBy('user.apellidos', 'ASC')
            .limit(limit)
            .getMany();

        return users.map(user => ({
            id: user.id,
            nombre: user.nombre,
            apellidos: user.apellidos,
            email: user.email,
            status: user.status,
            fullName: `${user.nombre} ${user.apellidos}`
        }));
    }

    async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        await this.userRepository.update(userId, { password: hashedPassword });
    }

    async setPasswordResetToken(userId: string, token: string): Promise<void> {
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 30); // 30 minutes from now
        
        await this.userRepository.update(userId, {
            resetPasswordToken: token,
            resetPasswordExpires: expires
        });
    }

    async findByResetToken(token: string): Promise<User | null> {
        return await this.userRepository
            .createQueryBuilder('user')
            .where('user.resetPasswordToken = :token', { token })
            .andWhere('user.resetPasswordExpires > :now', { now: new Date() })
            .getOne();
    }

    async clearPasswordResetToken(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined
        });
    }
}
