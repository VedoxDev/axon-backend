import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  ManyToMany, 
  OneToMany, 
  JoinTable, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { TaskSection } from '../../sections/entities/task-section.entity';
import { Subtask } from './subtask.entity';
import { Label } from './label.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Relationships
  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  project?: Project; // null = personal task

  @ManyToOne(() => TaskSection, { nullable: true, onDelete: 'SET NULL' })
  section?: TaskSection | null; // null = no section (backlog)

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  createdBy: User;

  // Assignment (many-to-many)
  @ManyToMany(() => User)
  @JoinTable({ name: 'task_assignments' })
  assignees: User[];

  // Labels (many-to-many) - only for project tasks
  @ManyToMany(() => Label)
  @JoinTable({ name: 'task_labels' })
  labels: Label[];

  // Properties
  @Column({ type: 'int', default: 2 })
  priority: 1 | 2 | 3 | 4; // 1=Low, 2=Medium, 3=High, 4=Critical

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ default: 'todo' })
  status: 'todo' | 'in_progress' | 'done';

  @Column({ default: 0 })
  order: number; // For ordering within sections

  // Subtasks
  @OneToMany(() => Subtask, subtask => subtask.task, { cascade: true })
  subtasks: Subtask[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 