import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';
  import { Project } from '../../projects/entities/project.entity';
  
  @Entity()
  export class TaskSection {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    name: string;
  
    @Column()
    order: number;
  
    @ManyToOne(() => Project, (project) => project.sections, {
      onDelete: 'CASCADE',
    })
    project: Project;
  }
  