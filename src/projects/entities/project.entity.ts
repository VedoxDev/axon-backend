import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProjectMember } from "./project-member.entity";

@Entity("projects")
export class Project {

    @PrimaryGeneratedColumn('uuid')
    id : string;

    @Column()
    name : string;

    @Column()
    description : string;

    @Column({default : 'active'})
    status : 'active' | 'archived';

    @ManyToOne(() => User)
    owner : User;

    @OneToMany(() => ProjectMember, member => member.project)
    members: ProjectMember[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}