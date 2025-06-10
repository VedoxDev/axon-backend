import { 
  Entity, 
  PrimaryGeneratedColumn, 
  ManyToOne,
  CreateDateColumn,
  Unique
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Announcement } from './announcement.entity';

@Entity('announcement_reads')
@Unique(['user', 'announcement']) // Prevent duplicate reads
export class AnnouncementRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Announcement, announcement => announcement.reads, { onDelete: 'CASCADE' })
  announcement: Announcement;

  @CreateDateColumn()
  readAt: Date;
} 