import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, MoreThan } from 'typeorm';
import { TaskSection } from './entities/task-section.entity';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto/create-section.dto';
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

    // Determine the order for the new section (auto-assign if not provided)
    let order = sectionDto.order;
    if (!order) {
      const maxOrder = project.sections.reduce((max, section) => Math.max(max, section.order), 0);
      order = maxOrder + 1;
    }

    // Create the new section
    const section = this.sectionsRepository.create({
      name: sectionDto.name,
      order: order,
      project: project,
    });

    // Save and return the new section
    return this.sectionsRepository.save(section);
  }

  async getProjectSections(projectId: string): Promise<TaskSection[]> {
    return this.sectionsRepository.find({
      where: { project: { id: projectId } },
      order: { order: 'ASC' }
    });
  }

  async update(user: User, projectId: string, sectionId: number, sectionDto: UpdateSectionDto): Promise<TaskSection> {
    const section = await this.sectionsRepository.findOne({
      where: { 
        id: sectionId, 
        project: { id: projectId } 
      },
      relations: ['project']
    });

    if (!section) {
      throw new NotFoundException('section-not-found');
    }

    // Check if name conflicts with other sections in the same project (only if name is being updated)
    if (sectionDto.name && sectionDto.name !== section.name) {
      const existingSection = await this.sectionsRepository.findOne({
        where: {
          name: sectionDto.name,
          project: { id: projectId },
          id: Not(sectionId) // Exclude current section
        },
      });

      if (existingSection) {
        throw new ConflictException('section-name-exists');
      }
    }

    // Update section properties
    if (sectionDto.name) section.name = sectionDto.name;
    if (sectionDto.order !== undefined) section.order = sectionDto.order;

    return this.sectionsRepository.save(section);
  }

  async delete(user: User, projectId: string, sectionId: number): Promise<{ message: string }> {
    const section = await this.sectionsRepository.findOne({
      where: { 
        id: sectionId, 
        project: { id: projectId } 
      }
    });

    if (!section) {
      throw new NotFoundException('section-not-found');
    }

    await this.sectionsRepository.remove(section);

    // Reorder remaining sections to fill the gap
    await this.reorderAfterDeletion(projectId, section.order);

    return { message: 'section-deleted-successfully' };
  }

  async reorderSections(user: User, projectId: string, reorderDto: ReorderSectionsDto): Promise<{ message: string }> {
    // Verify all sections belong to the project
    const sections = await this.sectionsRepository.find({
      where: { 
        project: { id: projectId },
        id: In(reorderDto.sectionIds)
      }
    });

    if (sections.length !== reorderDto.sectionIds.length) {
      throw new NotFoundException('some-sections-not-found');
    }

    // Update order for each section
    const updatePromises = reorderDto.sectionIds.map((sectionId, index) => {
      return this.sectionsRepository.update(sectionId, { order: index + 1 });
    });

    await Promise.all(updatePromises);

    return { message: 'sections-reordered-successfully' };
  }

  private async reorderAfterDeletion(projectId: string, deletedOrder: number): Promise<void> {
    // Get all sections with order greater than the deleted section
    const sectionsToReorder = await this.sectionsRepository.find({
      where: { 
        project: { id: projectId },
        order: MoreThan(deletedOrder)
      },
      order: { order: 'ASC' }
    });

    // Decrease order by 1 for each section
    const updatePromises = sectionsToReorder.map(section => {
      return this.sectionsRepository.update(section.id, { order: section.order - 1 });
    });

    await Promise.all(updatePromises);
  }
}
