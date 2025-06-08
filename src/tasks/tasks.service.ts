import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { Subtask } from './entities/subtask.entity';
import { Label } from './entities/label.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskSection } from '../sections/entities/task-section.entity';
import { CreateTaskDto, CreateSubtaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, UpdateSubtaskDto } from './dto/update-task.dto';
import { CreateLabelDto, UpdateLabelDto } from './dto/create-label.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Subtask)
    private subtaskRepository: Repository<Subtask>,
    @InjectRepository(Label)
    private labelRepository: Repository<Label>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(TaskSection)
    private sectionRepository: Repository<TaskSection>,
  ) {}

  // ========== TASK OPERATIONS ==========

  async createTask(user: User, createTaskDto: CreateTaskDto): Promise<Task> {
    const {
      projectId,
      sectionId,
      assigneeIds = [],
      labelIds = [],
      dueDate,
      ...taskData
    } = createTaskDto;

    // If it's a project task, verify user has access
    let project: Project | undefined;
    let section: TaskSection | undefined;

    if (projectId) {
      project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['members', 'members.user']
      }) || undefined;

      if (!project) {
        throw new NotFoundException('project-not-found');
      }

      // Check if user is a member of the project
      const isMember = project.members.some(member => member.user.id === user.id);
      if (!isMember) {
        throw new ForbiddenException('not-project-member');
      }

      // If section is specified, verify it belongs to the project
      if (sectionId) {
        section = await this.sectionRepository.findOne({
          where: { id: sectionId, project: { id: projectId } }
        }) || undefined;

        if (!section) {
          throw new NotFoundException('section-not-found');
        }
      }
    } else if (sectionId) {
      // Personal tasks can't have sections
      throw new BadRequestException('personal-tasks-cannot-have-sections');
    }

    // Get assignees (only for project tasks and only project members)
    let assignees: User[] = [];
    if (projectId && assigneeIds.length > 0) {
      const projectMemberIds = project!.members.map(member => member.user.id);
      const validAssigneeIds = assigneeIds.filter(id => projectMemberIds.includes(id));
      
      if (validAssigneeIds.length > 0) {
        assignees = await this.userRepository.findBy({ id: In(validAssigneeIds) });
      }
    }

    // Get labels (only for project tasks and only project labels)
    let labels: Label[] = [];
    if (projectId && labelIds.length > 0) {
      labels = await this.labelRepository.find({
        where: { id: In(labelIds), project: { id: projectId } }
      });
    }

    // Determine order if not provided
    let order = taskData.order || 0;
    if (!taskData.order) {
      const maxOrder = await this.taskRepository
        .createQueryBuilder('task')
        .select('MAX(task.order)', 'max')
        .where(projectId ? 'task.projectId = :projectId' : 'task.projectId IS NULL', { projectId })
        .andWhere(sectionId ? 'task.sectionId = :sectionId' : 'task.sectionId IS NULL', { sectionId })
        .getRawOne();
      
      order = (maxOrder?.max || 0) + 1;
    }

    // Create task
    const task = this.taskRepository.create({
      ...taskData,
      createdBy: user,
      project,
      section,
      assignees,
      labels,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      order
    });

    const savedTask = await this.taskRepository.save(task);
    
    // Reload with all relations to ensure consistent response format
    const taskWithAllRelations = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignees', 'subtasks', 'labels', 'createdBy', 'project', 'section']
    });

    return {
      ...taskWithAllRelations,
      section: taskWithAllRelations?.section || null
    } as Task;
  }

  async getPersonalTasks(user: User): Promise<Task[]> {
    const tasks = await this.taskRepository.find({
      where: { 
        createdBy: { id: user.id },
        project: IsNull()
      },
      relations: ['assignees', 'subtasks', 'labels', 'createdBy'],
      order: { order: 'ASC', createdAt: 'DESC' }
    });

    return tasks.map(task => ({
      ...task,
      section: task.section || null
    })) as Task[];
  }

  async getProjectTasks(user: User, projectId: string): Promise<Task[]> {
    // Verify user has access to project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user']
    });

    if (!project) {
      throw new NotFoundException('project-not-found');
    }

    const isMember = project.members.some(member => member.user.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('not-project-member');
    }

    const tasks = await this.taskRepository.find({
      where: { project: { id: projectId } },
      relations: ['assignees', 'subtasks', 'labels', 'createdBy', 'section'],
      order: { order: 'ASC', createdAt: 'DESC' }
    });

    return tasks.map(task => ({
      ...task,
      section: task.section || null
    })) as Task[];
  }

  async getSectionTasks(user: User, projectId: string, sectionId: number): Promise<Task[]> {
    // Verify access first
    await this.getProjectTasks(user, projectId);

    const tasks = await this.taskRepository.find({
      where: { 
        project: { id: projectId },
        section: { id: sectionId }
      },
      relations: ['assignees', 'subtasks', 'labels', 'createdBy', 'section'],
      order: { order: 'ASC', createdAt: 'DESC' }
    });

    return tasks.map(task => ({
      ...task,
      section: task.section || null
    })) as Task[];
  }

  async getTaskById(user: User, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignees', 'subtasks', 'labels', 'createdBy', 'project', 'section']
    });

    if (!task) {
      throw new NotFoundException('task-not-found');
    }

    // Check access
    if (task.project) {
      // Project task - check if user is member
      const project = await this.projectRepository.findOne({
        where: { id: task.project.id },
        relations: ['members', 'members.user']
      });

      const isMember = project?.members.some(member => member.user.id === user.id);
      if (!isMember) {
        throw new ForbiddenException('not-project-member');
      }
    } else {
      // Personal task - check if user is owner
      if (task.createdBy.id !== user.id) {
        throw new ForbiddenException('not-task-owner');
      }
    }

    return {
      ...task,
      section: task.section || null
    } as Task;
  }

  async updateTask(user: User, taskId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.getTaskById(user, taskId);
    
    const {
      assigneeIds,
      labelIds,
      sectionId,
      dueDate,
      ...updateData
    } = updateTaskDto;

    // Update section if provided
    console.log('UpdateTask - sectionId received:', sectionId, 'type:', typeof sectionId);
    if (sectionId !== undefined) {
      if (sectionId === null) {
        console.log('Removing task from section');
        // Remove from section - explicitly update the foreign key to null
        await this.taskRepository.update(task.id, { section: null });
        task.section = undefined;
      } else {
        console.log('Setting task.section to section with id:', sectionId);
        // Verify section exists and belongs to the project (if it's a project task)
        if (task.project) {
          const section = await this.sectionRepository.findOne({
            where: { id: sectionId, project: { id: task.project.id } }
          }) || undefined;

          if (!section) {
            throw new NotFoundException('section-not-found');
          }
          
          task.section = section;
        } else {
          // Personal tasks can't have sections
          throw new BadRequestException('personal-tasks-cannot-have-sections');
        }
      }
    }

    // Update assignees if provided
    if (assigneeIds !== undefined && task.project) {
      const project = await this.projectRepository.findOne({
        where: { id: task.project.id },
        relations: ['members', 'members.user']
      });

      const projectMemberIds = project!.members.map(member => member.user.id);
      const validAssigneeIds = assigneeIds.filter(id => projectMemberIds.includes(id));
      
      if (validAssigneeIds.length > 0) {
        task.assignees = await this.userRepository.findBy({ id: In(validAssigneeIds) });
      } else {
        task.assignees = [];
      }
    }

    // Update labels if provided
    if (labelIds !== undefined && task.project) {
      task.labels = await this.labelRepository.find({
        where: { id: In(labelIds), project: { id: task.project.id } }
      });
    }

    // Update other fields (excluding sectionId since we handled it above)
    Object.assign(task, updateData);

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    const savedTask = await this.taskRepository.save(task);
    
    // Reload the task with all relations to ensure consistent response format
    const taskWithAllRelations = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['assignees', 'subtasks', 'labels', 'createdBy', 'project', 'section']
    });

    return {
      ...taskWithAllRelations,
      section: taskWithAllRelations?.section || null
    } as Task;
  }

  async deleteTask(user: User, taskId: string): Promise<{ message: string }> {
    const task = await this.getTaskById(user, taskId);
    
    await this.taskRepository.remove(task);
    
    return { message: 'task-deleted-successfully' };
  }

  // ========== SUBTASK OPERATIONS ==========

  async createSubtask(user: User, taskId: string, createSubtaskDto: CreateSubtaskDto): Promise<Subtask> {
    const task = await this.getTaskById(user, taskId);

    // Determine order
    let order = createSubtaskDto.order || 0;
    if (!createSubtaskDto.order) {
      const maxOrder = await this.subtaskRepository
        .createQueryBuilder('subtask')
        .select('MAX(subtask.order)', 'max')
        .where('subtask.taskId = :taskId', { taskId })
        .getRawOne();
        
      order = (maxOrder?.max || 0) + 1;
    }

    const subtask = this.subtaskRepository.create({
      ...createSubtaskDto,
      task,
      order
    });

    return this.subtaskRepository.save(subtask);
  }

  async updateSubtask(user: User, taskId: string, subtaskId: number, updateSubtaskDto: UpdateSubtaskDto): Promise<Subtask> {
    const task = await this.getTaskById(user, taskId);
    
    const subtask = await this.subtaskRepository.findOne({
      where: { id: subtaskId, task: { id: taskId } }
    });

    if (!subtask) {
      throw new NotFoundException('subtask-not-found');
    }

    Object.assign(subtask, updateSubtaskDto);
    
    return this.subtaskRepository.save(subtask);
  }

  async deleteSubtask(user: User, taskId: string, subtaskId: number): Promise<{ message: string }> {
    const task = await this.getTaskById(user, taskId);
    
    const subtask = await this.subtaskRepository.findOne({
      where: { id: subtaskId, task: { id: taskId } }
    });

    if (!subtask) {
      throw new NotFoundException('subtask-not-found');
    }

    await this.subtaskRepository.remove(subtask);
    
    return { message: 'subtask-deleted-successfully' };
  }

  // ========== LABEL OPERATIONS ==========

  async createLabel(user: User, projectId: string, createLabelDto: CreateLabelDto): Promise<Label> {
    // Verify user has access to project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user']
    });

    if (!project) {
      throw new NotFoundException('project-not-found');
    }

    const isMember = project.members.some(member => member.user.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('not-project-member');
    }

    // Check if label name already exists in project
    const existingLabel = await this.labelRepository.findOne({
      where: { name: createLabelDto.name, project: { id: projectId } }
    });

    if (existingLabel) {
      throw new BadRequestException('label-name-exists');
    }

    const label = this.labelRepository.create({
      ...createLabelDto,
      project
    });

    return this.labelRepository.save(label);
  }

  async getProjectLabels(user: User, projectId: string): Promise<Label[]> {
    // Verify access
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user']
    });

    if (!project) {
      throw new NotFoundException('project-not-found');
    }

    const isMember = project.members.some(member => member.user.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('not-project-member');
    }

    return this.labelRepository.find({
      where: { project: { id: projectId } },
      order: { name: 'ASC' }
    });
  }

  async updateLabel(user: User, projectId: string, labelId: number, updateLabelDto: UpdateLabelDto): Promise<Label> {
    // Verify access
    await this.getProjectLabels(user, projectId);

    const label = await this.labelRepository.findOne({
      where: { id: labelId, project: { id: projectId } }
    });

    if (!label) {
      throw new NotFoundException('label-not-found');
    }

    // Check name uniqueness if name is being updated
    if (updateLabelDto.name && updateLabelDto.name !== label.name) {
      const existingLabel = await this.labelRepository.findOne({
        where: { name: updateLabelDto.name, project: { id: projectId } }
      });

      if (existingLabel) {
        throw new BadRequestException('label-name-exists');
      }
    }

    Object.assign(label, updateLabelDto);
    
    return this.labelRepository.save(label);
  }

  async deleteLabel(user: User, projectId: string, labelId: number): Promise<{ message: string }> {
    // Verify access
    await this.getProjectLabels(user, projectId);

    const label = await this.labelRepository.findOne({
      where: { id: labelId, project: { id: projectId } }
    });

    if (!label) {
      throw new NotFoundException('label-not-found');
    }

    await this.labelRepository.remove(label);
    
    return { message: 'label-deleted-successfully' };
  }
} 