import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
    constructor(
        private readonly projectService : ProjectsService
    ) {}

    @Post()
    @UseGuards(AuthGuard("jwt"))
    async createProject(
        @GetUser() user : User,
        @Body() projectDto : CreateProjectDto
    ) {
        return this.projectService.createProject(user, projectDto)
    }
}
