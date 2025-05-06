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
        
        // Prepare project object
        const project = this.projectRepository.create({
            ...projectDto,
            owner: user
        });

        // Saving project
        const savedProject: Project = await this.projectRepository.save(project);

        // Add user as owner
        const member = this.projectMemberRepository.create({
            project : savedProject,
            user: user,
            role: "owner"
        });
        
        await this.projectMemberRepository.save(member);

        return {
            message: 'project-created-succesfully',
            id: savedProject.id,
        };   
    }

    async getProject(memberUser : User, projectId : string) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['members', 'members.user']
        });

        if (!project) {
            throw new NotFoundException('project-not-found');
        }

        const isMember = project.members.some(member => 
            member.user.id === memberUser.id
        );

        if (!isMember) {
            throw new ForbiddenException('not-authorized-to-get');
        }

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
        // Find the project and check if it exists
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['members', 'members.user']
        });

        if (!project) {
            throw new NotFoundException('project-not-found');
        }

        // Check if inviter is owner or admin
        const inviterMember = project.members.find(member => 
            member.user.id === inviterUser.id && 
            (member.role === 'owner' || member.role === 'admin')
        );

        if (!inviterMember) {
            throw new ForbiddenException('not-authorized-to-invite');
        }

        // Find the user to invite - prioritize userId over email
        let userToInvite: User | null = null;
        
        if (inviteDto.userId) {
            userToInvite = await this.usersService.findById(inviteDto.userId);
        } else {
            userToInvite = await this.usersService.findByEmail(inviteDto.email!);
        }

        if (!userToInvite) {
            throw new NotFoundException('user-to-invite-not-found');
        }

        // Check if user is already a member
        const isAlreadyMember = project.members.some(member => 
            member.user.id === userToInvite!.id
        );

        if (isAlreadyMember) {
            throw new BadRequestException('user-already-member');
        }

        // Create new project member
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
}
