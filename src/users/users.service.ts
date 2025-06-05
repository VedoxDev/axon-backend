import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
