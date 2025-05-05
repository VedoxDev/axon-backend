import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

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

    @Get('mine')
    @UseGuards(AuthGuard("jwt"))
    async getMeProjects(
        @GetUser() user : User,
    ) {
        return this.projectService.getUserProjects(user);
    }

    @Post(':id/invite')
    @UseGuards(AuthGuard("jwt"))
    async inviteMember(
        @Param('id') projectId: string,
        @GetUser() user: User,
        @Body() inviteDto: InviteMemberDto
    ) {
        return this.projectService.inviteMember(projectId, user, inviteDto);
    }
}
