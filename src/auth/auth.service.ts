import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(
        private readonly UsersService: UsersService,
        private readonly jwtService: JwtService
    ) {}
    
    // Validate credentials
    async validateUser(loginDto: LoginDto) {
        const user = await this.UsersService.findByEmail(loginDto.email.toLowerCase());

        // User does not exist
        if (!user) {
            throw new UnauthorizedException("invalid-credentials");
        } 

        const match = await bcrypt.compare(loginDto.password, user.password);

        // Password does not match
        if (!match) {
            throw new UnauthorizedException("invalid-credentials");
        }

        return user;
    }

    // Generate JWT token for user
    async login(user: User) {

        // Payload encoded in JWT token
        const payload = {
            id: user.id,
            email: user.email
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
