import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

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

    // Change user password
    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

        // Verify new password matches confirmation
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('passwords-do-not-match');
        }

        // Get user from database
        const user = await this.UsersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('user-not-found');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('current-password-incorrect');
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new BadRequestException('new-password-must-be-different');
        }

        // Hash new password and update
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await this.UsersService.updatePassword(userId, hashedNewPassword);

        return {
            message: 'password-changed-successfully'
        };
    }
}
