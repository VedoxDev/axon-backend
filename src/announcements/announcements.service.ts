import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectMember } from 'src/projects/entities/project-member.entity';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {

  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private announcementReadRepository: Repository<AnnouncementRead>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async createAnnouncement(user: User, projectId: string, createDto: CreateAnnouncementDto) {
    // Verify project exists
    const project = await this.projectRepository.findOne({ 
      where: { id: projectId } 
    });
    if (!project) {
      throw new NotFoundException('project-not-found');
    }

    // Create announcement
    const announcement = this.announcementRepository.create({
      ...createDto,
      project,
      createdBy: user,
      type: createDto.type || 'info',
      pinned: createDto.pinned || false
    });

    const savedAnnouncement = await this.announcementRepository.save(announcement);

    return {
      message: 'announcement-created-successfully',
      announcement: {
        id: savedAnnouncement.id,
        title: savedAnnouncement.title,
        content: savedAnnouncement.content,
        type: savedAnnouncement.type,
        pinned: savedAnnouncement.pinned,
        createdAt: savedAnnouncement.createdAt
      }
    };
  }

  async getProjectAnnouncements(user: User, projectId: string) {
    const announcements = await this.announcementRepository.find({
      where: { project: { id: projectId } },
      relations: ['createdBy', 'reads', 'reads.user'],
      order: { 
        pinned: 'DESC', 
        createdAt: 'DESC' 
      }
    });

    // Add read status for current user
    return announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      pinned: announcement.pinned,
      createdBy: {
        id: announcement.createdBy.id,
        nombre: announcement.createdBy.nombre,
        apellidos: announcement.createdBy.apellidos,
        fullName: `${announcement.createdBy.nombre} ${announcement.createdBy.apellidos}`
      },
      isRead: announcement.reads.some(read => read.user.id === user.id),
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt
    }));
  }

  async getUserAnnouncements(user: User) {
    // Get all projects user is member of
    const memberships = await this.projectMemberRepository.find({
      where: { user: { id: user.id } },
      relations: ['project']
    });

    if (memberships.length === 0) {
      return {
        announcements: [],
        unreadCount: 0,
        stats: { total: 0, unread: 0, urgent: 0, pinned: 0 }
      };
    }

    const projectIds = memberships.map(m => m.project.id);

    // Get all announcements from user's projects
    const announcements = await this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.project', 'project')
      .leftJoinAndSelect('announcement.createdBy', 'createdBy')
      .leftJoinAndSelect('announcement.reads', 'reads', 'reads.userId = :userId', { userId: user.id })
      .where('announcement.projectId IN (:...projectIds)', { projectIds })
      .orderBy('announcement.pinned', 'DESC')
      .addOrderBy('announcement.createdAt', 'DESC')
      .getMany();

    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      pinned: announcement.pinned,
      project: {
        id: announcement.project.id,
        name: announcement.project.name
      },
      createdBy: {
        id: announcement.createdBy.id,
        nombre: announcement.createdBy.nombre,
        apellidos: announcement.createdBy.apellidos,
        fullName: `${announcement.createdBy.nombre} ${announcement.createdBy.apellidos}`
      },
      isRead: announcement.reads.length > 0,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt
    }));

    const stats = {
      total: announcements.length,
      unread: formattedAnnouncements.filter(a => !a.isRead).length,
      urgent: formattedAnnouncements.filter(a => a.type === 'urgent').length,
      pinned: formattedAnnouncements.filter(a => a.pinned).length
    };

    return {
      announcements: formattedAnnouncements,
      unreadCount: stats.unread,
      stats
    };
  }

  async markAsRead(user: User, announcementId: string) {
    // Verify announcement exists and user has access
    const announcement = await this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoin('announcement.project', 'project')
      .leftJoin('project.members', 'member')
      .where('announcement.id = :announcementId', { announcementId })
      .andWhere('member.userId = :userId', { userId: user.id })
      .getOne();

    if (!announcement) {
      throw new NotFoundException('announcement-not-found-or-no-access');
    }

    try {
      // Use INSERT ... ON CONFLICT DO NOTHING to handle race conditions
      await this.announcementReadRepository
        .createQueryBuilder()
        .insert()
        .into(AnnouncementRead)
        .values({
          user: { id: user.id },
          announcement: { id: announcementId }
        })
        .orIgnore() // PostgreSQL: ON CONFLICT DO NOTHING
        .execute();

      return { message: 'announcement-marked-as-read' };
    } catch (error) {
      // Fallback: check if it was already read
      const existingRead = await this.announcementReadRepository.findOne({
        where: { 
          user: { id: user.id }, 
          announcement: { id: announcementId } 
        }
      });

      if (existingRead) {
        return { message: 'announcement-already-read' };
      }

      // If it's not a duplicate error, re-throw
      throw error;
    }
  }
} 