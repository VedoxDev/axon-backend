import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { RespondInvitationDto } from './dto/respond-invitation.dto';
import { ChangeMemberRoleDto } from './dto/change-member-role.dto';
import { UsersService } from 'src/users/users.service';
import { SectionsService } from 'src/sections/sections.service';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from 'src/sections/dto/create-section.dto';

@Injectable()
export class ProjectsService {
    
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository : Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository : Repository<ProjectMember>,
        @InjectRepository(ProjectInvitation)
        private readonly projectInvitationRepository : Repository<ProjectInvitation>,
        private readonly usersService: UsersService,
        private readonly sectionsService: SectionsService
    ) {}

    
    async createProject(user : User, projectDto : CreateProjectDto) {
        
        // Prepara el objeto del proyecto
        const project = this.projectRepository.create({
            ...projectDto,
            owner: user
        });

        // Guarda el proyecto
        const savedProject: Project = await this.projectRepository.save(project);

        // Añade el usuario como propietario
        const member = this.projectMemberRepository.create({
            project : savedProject,
            user: user,
            role: "owner"
        });
        
        // Guarda el miembro
        await this.projectMemberRepository.save(member);

        return {
            message: 'project-created-succesfully',
            id: savedProject.id,
        };   
    }

    async getProject(memberUser : User, projectId : string) {

        // Busca el proyecto
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['members', 'members.user']
        });

        // Si el proyecto no existe, lanza un error
        if (!project) {
            throw new NotFoundException('project-not-found');
        }

        // Busca los miembros del proyecto
        const projectMembers = await this.projectMemberRepository.find({
            where: { project: { id: projectId } },
            relations: ['user']
        });

        return {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            members: projectMembers.map(member => ({
                id: member.user.id,
                nombre: member.user.nombre,
                apellidos: member.user.apellidos,
                role: member.role,
                status: member.user.status
            }))
        };
    }

    async getUserProjects(user : User) {
        
        // Busca los proyectos del usuario
        const userProjects = await this.projectMemberRepository.find({
            where: { user : { id : user.id } }, 
            relations: ['project']
        });

        return userProjects.map(pm => ({
            id: pm.project.id,
            name: pm.project.name,
            description: pm.project.description,
            status: pm.project.status,
            role: pm.role,
        }));
    }

    async inviteMember(projectId: string, inviterUser: User, inviteDto: InviteMemberDto) {
        // Busca el proyecto y verifica si existe
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['members', 'members.user']
        });

        // Si el proyecto no existe, lanza un error
        if (!project) {
            throw new NotFoundException('project-not-found');
        }

        // Busca el usuario a invitar - prioriza userId sobre email
        let userToInvite: User | null = null;
        
        if (inviteDto.userId) {
            userToInvite = await this.usersService.findById(inviteDto.userId);
        } else {
            userToInvite = await this.usersService.findByEmail(inviteDto.email!);
        }

        if (!userToInvite) {
            throw new NotFoundException('user-to-invite-not-found');
        }

        // Verifica si el usuario ya es miembro del proyecto
        const isAlreadyMember = project.members.some(member => 
            member.user.id === userToInvite!.id
        );

        if (isAlreadyMember) {
            throw new BadRequestException('user-already-member');
        }

        // Verifica si ya existe una invitación pendiente
        const existingInvitation = await this.projectInvitationRepository.findOne({
            where: { 
                project: { id: projectId },
                invitedUser: { id: userToInvite.id },
                status: 'pending'
            }
        });

        if (existingInvitation) {
            throw new BadRequestException('invitation-already-pending');
        }

        // Crea una nueva invitación en lugar de añadir directamente como miembro
        const invitation = this.projectInvitationRepository.create({
            project,
            invitedUser: userToInvite,
            inviterUser: inviterUser,
            role: 'member',
            status: 'pending'
        });

        await this.projectInvitationRepository.save(invitation);

        return {
            message: 'invitation-sent-successfully',
            invitationId: invitation.id,
            userId: userToInvite.id
        };
    }

    async deleteProject(user: User, projectId: string) {
        // Busca el proyecto y verifica si existe
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['members', 'members.user']
        });
        
        // Si el proyecto no existe, lanza un error
        if (!project) {
            throw new NotFoundException('project-not-found');
        }

        // Elimina todos los miembros del proyecto antes de eliminar el proyecto
        await this.projectMemberRepository.delete({ project: { id: projectId } });

        // Elimina el proyecto
        await this.projectRepository.remove(project);

        return {
            message: 'project-deleted-successfully'
        };
    }

    async getUserInvitations(user: User) {
        // Busca todas las invitaciones pendientes para el usuario
        const invitations = await this.projectInvitationRepository.find({
            where: { 
                invitedUser: { id: user.id },
                status: 'pending'
            },
            relations: ['project', 'inviterUser']
        });

        return invitations.map(invitation => ({
            id: invitation.id,
            project: {
                id: invitation.project.id,
                name: invitation.project.name,
                description: invitation.project.description
            },
            inviter: {
                id: invitation.inviterUser.id,
                nombre: invitation.inviterUser.nombre,
                apellidos: invitation.inviterUser.apellidos
            },
            role: invitation.role,
            createdAt: invitation.createdAt
        }));
    }

    async respondToInvitation(user: User, invitationId: string, respondDto: RespondInvitationDto) {
        // Busca la invitación
        const invitation = await this.projectInvitationRepository.findOne({
            where: { 
                id: invitationId,
                invitedUser: { id: user.id },
                status: 'pending'
            },
            relations: ['project', 'invitedUser']
        });

        if (!invitation) {
            throw new NotFoundException('invitation-not-found');
        }

        if (respondDto.action === 'accept') {
            // Verifica si el usuario ya es miembro del proyecto (por si acaso)
            const isAlreadyMember = await this.projectMemberRepository.findOne({
                where: {
                    project: { id: invitation.project.id },
                    user: { id: user.id }
                }
            });

            if (isAlreadyMember) {
                throw new BadRequestException('user-already-member');
            }

            // Crea el miembro del proyecto
            const newMember = this.projectMemberRepository.create({
                project: invitation.project,
                user: invitation.invitedUser,
                role: invitation.role
            });

            await this.projectMemberRepository.save(newMember);

            // Actualiza el estado de la invitación
            invitation.status = 'accepted';
            await this.projectInvitationRepository.save(invitation);

            return {
                message: 'invitation-accepted-successfully',
                projectId: invitation.project.id
            };
        } else {
            // Rechaza la invitación
            invitation.status = 'rejected';
            await this.projectInvitationRepository.save(invitation);

            return {
                message: 'invitation-rejected-successfully'
            };
        }
    }

    // Section management methods
    async createSection(user: User, projectId: string, sectionDto: CreateSectionDto) {
        return this.sectionsService.create(user, projectId, sectionDto);
    }

    async getProjectSections(user: User, projectId: string) {
        return this.sectionsService.getProjectSections(projectId);
    }

    async updateSection(user: User, projectId: string, sectionId: number, sectionDto: UpdateSectionDto) {
        return this.sectionsService.update(user, projectId, sectionId, sectionDto);
    }

    async deleteSection(user: User, projectId: string, sectionId: number) {
        return this.sectionsService.delete(user, projectId, sectionId);
    }

    async reorderSections(user: User, projectId: string, reorderDto: ReorderSectionsDto) {
        return this.sectionsService.reorderSections(user, projectId, reorderDto);
    }

    async changeMemberRole(ownerUser: User, projectId: string, memberId: string, newRole: 'member' | 'admin') {
        // Verify project exists and get it with members
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['members', 'members.user', 'owner']
        });

        if (!project) {
            throw new NotFoundException('project-not-found');
        }

        // Verify the requesting user is the project owner
        if (project.owner.id !== ownerUser.id) {
            throw new ForbiddenException('only-owner-can-change-roles');
        }

        // Find the member to change
        const memberToChange = await this.projectMemberRepository.findOne({
            where: { 
                project: { id: projectId },
                user: { id: memberId }
            },
            relations: ['user', 'project']
        });

        if (!memberToChange) {
            throw new NotFoundException('member-not-found');
        }

        // Cannot change owner role
        if (memberToChange.role === 'owner') {
            throw new BadRequestException('cannot-change-owner-role');
        }

        // Cannot change your own role (owner trying to change themselves)
        if (memberToChange.user.id === ownerUser.id) {
            throw new BadRequestException('cannot-change-own-role');
        }

        // Update the role
        memberToChange.role = newRole;
        await this.projectMemberRepository.save(memberToChange);

        return {
            message: 'member-role-changed-successfully',
            memberId: memberToChange.user.id,
            newRole: newRole,
            memberName: `${memberToChange.user.nombre} ${memberToChange.user.apellidos}`
        };
    }
}
