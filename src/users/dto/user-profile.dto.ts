import { Exclude, Expose } from "class-transformer";

export class UserProfileDto {
    @Expose()
    id: string;

    @Expose()
    email: string;
    
    @Exclude()
    password: string;

    @Expose()
    nombre: string;

    @Expose()
    apellidos: string;

    @Expose()
    status: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}