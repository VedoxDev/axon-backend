import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ParseUUIDPipe,
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidateBodyPipe } from '../common/pipes/validate-body.pipe';
import { User } from '../users/user.entity';
import { CreateTaskDto, CreateSubtaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, UpdateSubtaskDto } from './dto/update-task.dto';
import { CreateLabelDto, UpdateLabelDto } from './dto/create-label.dto';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ========== TASK ENDPOINTS ==========

  @Post()
  @UsePipes(new ValidateBodyPipe({
    requiredFields: ['title'],
    dto: CreateTaskDto
  }))
  async createTask(
    @GetUser() user: User,
    @Body() createTaskDto: CreateTaskDto
  ) {
    return this.tasksService.createTask(user, createTaskDto);
  }

  @Get('personal')
  async getPersonalTasks(@GetUser() user: User) {
    return this.tasksService.getPersonalTasks(user);
  }

  @Get('project/:projectId')
  async getProjectTasks(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string
  ) {
    return this.tasksService.getProjectTasks(user, projectId);
  }

  @Get('project/:projectId/section/:sectionId')
  async getSectionTasks(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string,
    @Param('sectionId', new ParseIntPipe({
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-section-id')
    })) sectionId: number
  ) {
    return this.tasksService.getSectionTasks(user, projectId, sectionId);
  }

  @Get(':taskId')
  async getTaskById(
    @GetUser() user: User,
    @Param('taskId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-task-id')
    })) taskId: string
  ) {
    return this.tasksService.getTaskById(user, taskId);
  }

  @Put(':taskId')
  async updateTask(
    @GetUser() user: User,
    @Param('taskId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-task-id')
    })) taskId: string,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    return this.tasksService.updateTask(user, taskId, updateTaskDto);
  }

  @Delete(':taskId')
  async deleteTask(
    @GetUser() user: User,
    @Param('taskId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-task-id')
    })) taskId: string
  ) {
    return this.tasksService.deleteTask(user, taskId);
  }

  // ========== SUBTASK ENDPOINTS ==========

  @Post(':taskId/subtasks')
  @UsePipes(new ValidateBodyPipe({
    requiredFields: ['title'],
    dto: CreateSubtaskDto
  }))
  async createSubtask(
    @GetUser() user: User,
    @Param('taskId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-task-id')
    })) taskId: string,
    @Body() createSubtaskDto: CreateSubtaskDto
  ) {
    return this.tasksService.createSubtask(user, taskId, createSubtaskDto);
  }

  @Put(':taskId/subtasks/:subtaskId')
  async updateSubtask(
    @GetUser() user: User,
    @Param('taskId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-task-id')
    })) taskId: string,
    @Param('subtaskId', new ParseIntPipe({
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-subtask-id')
    })) subtaskId: number,
    @Body() updateSubtaskDto: UpdateSubtaskDto
  ) {
    return this.tasksService.updateSubtask(user, taskId, subtaskId, updateSubtaskDto);
  }

  @Delete(':taskId/subtasks/:subtaskId')
  async deleteSubtask(
    @GetUser() user: User,
    @Param('taskId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-task-id')
    })) taskId: string,
    @Param('subtaskId', new ParseIntPipe({
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-subtask-id')
    })) subtaskId: number
  ) {
    return this.tasksService.deleteSubtask(user, taskId, subtaskId);
  }

  // ========== LABEL ENDPOINTS ==========

  @Post('projects/:projectId/labels')
  @UsePipes(new ValidateBodyPipe({
    requiredFields: ['name', 'color'],
    dto: CreateLabelDto
  }))
  async createLabel(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string,
    @Body() createLabelDto: CreateLabelDto
  ) {
    return this.tasksService.createLabel(user, projectId, createLabelDto);
  }

  @Get('projects/:projectId/labels')
  async getProjectLabels(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string
  ) {
    return this.tasksService.getProjectLabels(user, projectId);
  }

  @Put('projects/:projectId/labels/:labelId')
  async updateLabel(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string,
    @Param('labelId', new ParseIntPipe({
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-label-id')
    })) labelId: number,
    @Body() updateLabelDto: UpdateLabelDto
  ) {
    return this.tasksService.updateLabel(user, projectId, labelId, updateLabelDto);
  }

  @Delete('projects/:projectId/labels/:labelId')
  async deleteLabel(
    @GetUser() user: User,
    @Param('projectId', new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-project-id')
    })) projectId: string,
    @Param('labelId', new ParseIntPipe({
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException('invalid-label-id')
    })) labelId: number
  ) {
    return this.tasksService.deleteLabel(user, projectId, labelId);
  }
} 