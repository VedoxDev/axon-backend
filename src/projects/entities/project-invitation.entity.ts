import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Project } from "./project.entity";

@Entity("project_invitations")
export class ProjectInvitation {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Project, { onDelete: 'CASCADE' })
    project: Project;

    @ManyToOne(() => User)
    invitedUser: User;

    @ManyToOne(() => User)
    inviterUser: User;

    @Column({ default: 'pending' })
    status: 'pending' | 'accepted' | 'rejected';

    @Column({ default: 'member' })
    role: 'admin' | 'member';

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 