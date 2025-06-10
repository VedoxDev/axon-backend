import { 
  Controller, 
  Post, 
  Get, 
  Put,
  Body, 
  Param, 
  UseGuards, 
  UsePipes,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { Permission } from 'src/common/enums/permission.enum';
import { ValidateBodyPipe } from 'src/common/pipes/validate-body.pipe';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller()
export class AnnouncementsController {

  constructor(private readonly announcementsService: AnnouncementsService) {}

  // Create announcement in project
  @Post('projects/:projectId/announcements')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermission(Permission.MANAGE_ANNOUNCEMENTS)
  @UsePipes(new ValidateBodyPipe({
    requiredFields: ['title', 'content'],
    dto: CreateAnnouncementDto
  }))
  async createAnnouncement(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({ 
      version: '4', 
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string,
    @Body() createDto: CreateAnnouncementDto
  ) {
    return this.announcementsService.createAnnouncement(user, projectId, createDto);
  }

  // Get project announcements
  @Get('projects/:projectId/announcements')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermission(Permission.VIEW_PROJECT)
  async getProjectAnnouncements(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({ 
      version: '4', 
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string
  ) {
    return this.announcementsService.getProjectAnnouncements(user, projectId);
  }

  // Get user's announcements from all projects (personal area)
  @Get('auth/me/announcements')
  @UseGuards(AuthGuard('jwt'))
  async getUserAnnouncements(@GetUser() user: User) {
    return this.announcementsService.getUserAnnouncements(user);
  }

  // Mark announcement as read
  @Put('announcements/:announcementId/read')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(
    @GetUser() user: User,
    @Param('announcementId', new ParseUUIDPipe({ 
      version: '4', 
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-announcement-id')
    })) announcementId: string
  ) {
    return this.announcementsService.markAsRead(user, announcementId);
  }
} 