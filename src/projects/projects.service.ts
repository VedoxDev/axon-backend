import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ProjectsService {
    
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository : Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository : Repository<ProjectMember>,
        private readonly usersService: UsersService
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

        // Verifica si el usuario es miembro del proyecto
        const isMember = project.members.some(member => 
            member.user.id === memberUser.id
        );

        // Si el usuario no es miembro del proyecto, lanza un error

        if (!isMember) {
            throw new ForbiddenException('not-authorized-to-get');
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

        // Verifica si el invitador es propietario o administrador
        const inviterMember = project.members.find(member => 
            member.user.id === inviterUser.id && 
            (member.role === 'owner' || member.role === 'admin')
        );

        // Si el invitador no es propietario o administrador, lanza un error
        if (!inviterMember) {
            throw new ForbiddenException('not-authorized-to-invite');
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

        // Crea un nuevo miembro del proyecto
        const newMember = this.projectMemberRepository.create({
            project,
            user: userToInvite,
            role: 'member'
        });

        await this.projectMemberRepository.save(newMember);

        return {
            message: 'member-invited-successfully',
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

        // Busca el miembro del proyecto que intenta eliminar
        const member = project.members.find(member => 
            member.user.id === user.id
        );

        // Si el miembro no existe, lanza un error
        if (!member) {
            throw new ForbiddenException('not-authorized-to-delete');
        }

        // Si el miembro no es el propietario, lanza un error
        if (member.role !== 'owner') {
            throw new ForbiddenException('only-owner-can-delete');
        }

        // Elimina todos los miembros del proyecto antes de eliminar el proyecto
        await this.projectMemberRepository.delete({ project: { id: projectId } });

        // Elimina el proyecto
        await this.projectRepository.remove(project);

        return {
            message: 'project-deleted-successfully'
        };
    }
}
