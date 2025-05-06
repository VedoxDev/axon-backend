import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProjectMember } from "./project-member.entity";
import { TaskSection } from "src/sections/entities/task-section.entity";

@Entity("projects")
export class Project {

    @PrimaryGeneratedColumn('uuid')
    id : string;

    @Column()
    name : string;

    @Column({ nullable: true })
    description : string;

    @Column({default : 'active'})
    status : 'active' | 'archived';

    @ManyToOne(() => User)
    owner : User;

    @OneToMany(() => ProjectMember, member => member.project)
    members: ProjectMember[];

    @OneToMany(() => TaskSection, section => section.project)
    sections: TaskSection[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}