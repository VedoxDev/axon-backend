import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne,
  OneToMany,
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { AnnouncementRead } from './announcement-read.entity';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'info' })
  type: 'info' | 'warning' | 'success' | 'urgent';

  @Column({ default: false })
  pinned: boolean;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  createdBy: User;

  @OneToMany(() => AnnouncementRead, read => read.announcement, { cascade: true })
  reads: AnnouncementRead[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 