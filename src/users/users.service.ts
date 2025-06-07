import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PlainObjectToNewEntityTransformer } from 'typeorm/query-builder/transformer/PlainObjectToNewEntityTransformer';
import { plainToInstance } from 'class-transformer';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {

    
    constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.findByEmail(createUserDto.email);

        if (existingUser) {
            throw new BadRequestException('email-already-exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword
        });

        return this.userRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: {email: email.toLowerCase()} });
    }

    async findById(userId: string) {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async getProfile(userId: string): Promise<UserProfileDto> {
        const user = await this.findById(userId);
        
        if (!user) {
            throw new NotFoundException("user-not-found");
        }

        return plainToInstance(UserProfileDto, user, { excludeExtraneousValues: true });
    }

    async searchUsers(query: string, limit: number = 10) {
        // Sanitize the query to prevent SQL injection
        const sanitizedQuery = query.trim();
        
        if (sanitizedQuery.length < 2) {
            return [];
        }

        // Use QueryBuilder for more efficient search with CONCAT for full name search
        const users = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.nombre', 
                'user.apellidos', 
                'user.email', 
                'user.status'
            ])
            .where(
                'LOWER(user.nombre) LIKE LOWER(:query) OR ' +
                'LOWER(user.apellidos) LIKE LOWER(:query) OR ' +
                'LOWER(user.email) LIKE LOWER(:query) OR ' +
                'LOWER(CONCAT(user.nombre, \' \', user.apellidos)) LIKE LOWER(:query)',
                { query: `%${sanitizedQuery}%` }
            )
            .orderBy('user.nombre', 'ASC')
            .addOrderBy('user.apellidos', 'ASC')
            .limit(limit)
            .getMany();

        return users.map(user => ({
            id: user.id,
            nombre: user.nombre,
            apellidos: user.apellidos,
            email: user.email,
            status: user.status,
            fullName: `${user.nombre} ${user.apellidos}`
        }));
    }
}
