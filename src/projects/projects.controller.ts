import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ValidateBodyPipe } from 'src/common/pipes/validate-body.pipe';
import { ProjectsService } from './projects.service';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permission } from 'src/common/enums/permission.enum';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';

@Controller('projects')
export class ProjectsController {
    constructor(
        private readonly projectService : ProjectsService
    ) {}
    
    // Crear proyecto
    @Post()
    @UseGuards(AuthGuard("jwt"))
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ["name"],
        dto: CreateProjectDto
    }))
    async createProject(
        @GetUser() user : User,
        @Body() projectDto : CreateProjectDto
    ) {
        return this.projectService.createProject(user, projectDto)
    }

    // Obtener proyectos del usuario
    @Get('mine')
    @UseGuards(AuthGuard("jwt"))
    async getMeProjects(
        @GetUser() user : User,
    ) {
        return this.projectService.getUserProjects(user);
    }

    // Obtener proyecto por id
    @Get(':projectId')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)
    @RequirePermission(Permission.VIEW_PROJECT)
    async getProject(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
    ){
        if(!projectId) {
            throw new BadRequestException("projectId-required")
        }
        
        return this.projectService.getProject(user, projectId);
    }

    // Invitar miembro al proyecto
    @Post(':projectId/invite')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)  
    @RequirePermission(Permission.MANAGE_MEMBERS)
    async inviteMember(
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId: string,
        @GetUser() user: User,
        @Body() inviteDto: InviteMemberDto
    ) {
        return this.projectService.inviteMember(projectId, user, inviteDto);
    }

    // Crear sección
    @Post(':projectId/sections')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)
    @RequirePermission(Permission.MANAGE_SECTIONS)
    async createSection(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
        // @Body() sectionDto : CreateSectionDto
    ) {
        // return this.projectService.createSection(user, projectId, sectionDto);
    }
    
    // Eliminar proyecto
    @Delete(':projectId')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)
    @RequirePermission(Permission.DELETE_PROJECT)
    async deleteProject(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
    ) {
        return this.projectService.deleteProject(user, projectId);
    }
}
