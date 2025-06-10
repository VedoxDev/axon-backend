import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { RespondInvitationDto } from './dto/respond-invitation.dto';
import { ChangeMemberRoleDto } from './dto/change-member-role.dto';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from 'src/sections/dto/create-section.dto';
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
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ["name"],
        dto: CreateSectionDto
    }))
    async createSection(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
        @Body() sectionDto : CreateSectionDto
    ) {
        return this.projectService.createSection(user, projectId, sectionDto);
    }

    // Obtener secciones del proyecto
    @Get(':projectId/sections')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)
    @RequirePermission(Permission.VIEW_PROJECT)
    async getProjectSections(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
    ) {
        return this.projectService.getProjectSections(user, projectId);
    }

    // Reordenar secciones (drag and drop) - MUST come before parameterized route
    @Put(':projectId/sections/reorder')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)
    @RequirePermission(Permission.MANAGE_SECTIONS)
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ["sectionIds"],
        dto: ReorderSectionsDto
    }))
    async reorderSections(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
        @Body() reorderDto : ReorderSectionsDto
    ) {
        return this.projectService.reorderSections(user, projectId, reorderDto);
    }

    // Actualizar sección
    @Put(':projectId/sections/:sectionId')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)
    @RequirePermission(Permission.MANAGE_SECTIONS)
    async updateSection(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
        @Param('sectionId', new ParseIntPipe({
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-section-id')
        })) sectionId : number,
        @Body() sectionDto : UpdateSectionDto
    ) {
        return this.projectService.updateSection(user, projectId, sectionId, sectionDto);
    }

    // Eliminar sección
    @Delete(':projectId/sections/:sectionId')
    @UseGuards(AuthGuard("jwt"), PermissionsGuard)
    @RequirePermission(Permission.MANAGE_SECTIONS)
    async deleteSection(
        @GetUser() user : User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId : string,
        @Param('sectionId', new ParseIntPipe({
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-section-id')
        })) sectionId : number,
    ) {
        return this.projectService.deleteSection(user, projectId, sectionId);
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

    // Obtener invitaciones del usuario
    @Get('invitations/pending')
    @UseGuards(AuthGuard("jwt"))
    async getUserInvitations(
        @GetUser() user: User
    ) {
        return this.projectService.getUserInvitations(user);
    }

    // Responder a una invitación (aceptar o rechazar)
    @Put('invitations/:invitationId/respond')
    @UseGuards(AuthGuard("jwt"))
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ["action"],
        dto: RespondInvitationDto
    }))
    async respondToInvitation(
        @GetUser() user: User,
        @Param('invitationId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-invitation-id')
        })) invitationId: string,
        @Body() respondDto: RespondInvitationDto
    ) {
        return this.projectService.respondToInvitation(user, invitationId, respondDto);
    }

    // Cambiar rol de miembro (solo owner)
    @Put(':projectId/members/:memberId/role')
    @UseGuards(AuthGuard("jwt"))
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ["role"],
        dto: ChangeMemberRoleDto
    }))
    async changeMemberRole(
        @GetUser() user: User,
        @Param('projectId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-project-id')
        })) projectId: string,
        @Param('memberId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-member-id')
        })) memberId: string,
        @Body() changeRoleDto: ChangeMemberRoleDto
    ) {
        return this.projectService.changeMemberRole(user, projectId, memberId, changeRoleDto.role);
    }
}
