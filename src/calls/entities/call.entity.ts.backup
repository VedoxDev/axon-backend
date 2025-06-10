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

export enum CallType {
  DIRECT = 'direct',        // 1:1 call
  PROJECT = 'project'       // 1:many project call
}

export enum CallStatus {
  WAITING = 'waiting',      // Call initiated, waiting for participants
  ACTIVE = 'active',        // Call in progress
  ENDED = 'ended',          // Call finished
  CANCELLED = 'cancelled'   // Call cancelled before anyone joined
}

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomName: string; // LiveKit room name

  @Column({
    type: 'enum',
    enum: CallType
  })
  type: CallType;

  @Column({
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.WAITING
  })
  status: CallStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  initiator: User; // User who started the call

  // For direct calls (1:1)
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  recipient?: User;

  // For project calls (1:many)
  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  project?: Project;

  @Column({ nullable: true })
  title?: string; // Optional call title

  @Column({ nullable: true })
  startedAt?: Date; // When call actually started (first person joined)

  @Column({ nullable: true })
  endedAt?: Date; // When call ended

  @Column({ default: 0 })
  maxParticipants: number; // 0 = unlimited

  @Column({ default: false })
  audioOnly: boolean; // Audio-only call

  @Column({ default: false })
  recordCall: boolean; // Should record the call

  @OneToMany(() => CallParticipant, participant => participant.call, { cascade: true })
  participants: CallParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('call_participants')
export class CallParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Call, call => call.participants, { onDelete: 'CASCADE' })
  call: Call;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ nullable: true })
  joinedAt?: Date;

  @Column({ nullable: true })
  leftAt?: Date;

  @Column({ default: false })
  micMuted: boolean;

  @Column({ default: false })
  videoMuted: boolean;

  @Column({ default: false })
  isConnected: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 