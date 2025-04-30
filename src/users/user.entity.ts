import { ProjectMember } from "src/projects/entities/project-member.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    nombre: string;

    @Column()
    apellidos: string;

    @Column({ default: "offline"})
    status: "offline" | "online" | "away" | "busy";    

    @OneToMany(() => ProjectMember, member => member.user)
    memberships: ProjectMember[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}