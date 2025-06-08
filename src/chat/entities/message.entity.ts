import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  // For direct messages (1:1 chat)
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  recipient?: User;

  // For project conversations (group chat)
  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  project?: Project;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isEdited: boolean;

  // For call invitation messages
  @Column({ nullable: true })
  callId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 