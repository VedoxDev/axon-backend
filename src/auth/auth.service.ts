import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from 'src/common/services/email.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly UsersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService
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

    // Request password reset
    async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {
        const { email } = requestPasswordResetDto;

        // Find user by email
        const user = await this.UsersService.findByEmail(email.toLowerCase());
        
        // Always return success message to prevent email enumeration
        const successMessage = { message: 'password-reset-email-sent' };

        if (!user) {
            return successMessage;
        }

        // Generate secure token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Save token to database
        await this.UsersService.setPasswordResetToken(user.id, resetToken);

        // Send email
        await this.emailService.sendPasswordResetEmail(user.email, resetToken);

        return successMessage;
    }

    // Reset password using token
    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;

        // Find user by token
        const user = await this.UsersService.findByResetToken(token);

        if (!user) {
            throw new BadRequestException('invalid-or-expired-token');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await this.UsersService.updatePassword(user.id, hashedPassword);
        await this.UsersService.clearPasswordResetToken(user.id);

        return {
            message: 'password-reset-successful'
        };
    }

    // Verify reset token (optional endpoint for frontend validation)
    async verifyResetToken(token: string) {
        const user = await this.UsersService.findByResetToken(token);

        if (!user) {
            throw new BadRequestException('invalid-or-expired-token');
        }

        return {
            message: 'token-valid',
            email: user.email
        };
    }
}
