import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';


@Injectable()
export class ProjectsService {
    
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository : Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository : Repository<ProjectMember>
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
}
