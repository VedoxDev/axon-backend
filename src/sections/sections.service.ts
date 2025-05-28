import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskSection } from './entities/task-section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(TaskSection)
    private sectionsRepository: Repository<TaskSection>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(user: User, projectId: string, sectionDto: CreateSectionDto): Promise<TaskSection> {
    // Find the project
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['sections'], // Load existing sections
    });

    if (!project) {
      throw new NotFoundException(`project-not-found`);
    }

    // Check if a section with the same name already exists in this project
    const existingSection = await this.sectionsRepository.findOne({
      where: {
        name: sectionDto.name,
        project: { id: projectId },
      },
    });

    if (existingSection) {
      throw new ConflictException(`section-name-exists`);
    }

    // Determine the order for the new section
    const maxOrder = project.sections.reduce((max, section) => Math.max(max, section.order), 0);
    const newOrder = maxOrder + 1;

    // Create the new section
    const section = this.sectionsRepository.create({
      ...sectionDto,
      order: newOrder,
      project: project,
    });

    // Save and return the new section
    return this.sectionsRepository.save(section);
  }
}
