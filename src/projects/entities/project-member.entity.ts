import { User } from "src/users/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./project.entity";

@Entity("project_members")
export class ProjectMember {

    @PrimaryGeneratedColumn("uuid")
    id : string;

    @ManyToOne(() => User, user => user.memberships)
    user: User;

    @ManyToOne(() => Project, project => project.members)
    project: Project;

    @Column({ default : "member"})
    role: 'owner' | 'admin' | 'member';
}