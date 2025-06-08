import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from './task.entity';

@Entity('subtasks')
export class Subtask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => Task, task => task.subtasks, { onDelete: 'CASCADE' })
  task: Task;
} 