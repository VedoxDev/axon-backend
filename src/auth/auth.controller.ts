import { Controller, Post, Body, Get, UseGuards, UsePipes, Put, Param } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';
import { ValidateBodyPipe } from 'src/common/pipes/validate-body.pipe';
import { CreateProjectDto } from 'src/projects/dto/create-project.dto';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly userService: UsersService,
        private readonly authService: AuthService
    ) {}

    @Post('login')
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ['email', 'password'],
        dto: LoginDto
    }))
    async login(@Body() loginDto: LoginDto) {
        // Validate user credentials
        const user = await this.authService.validateUser(loginDto);
        // Generate JWT token
        return this.authService.login(user);
    }
    

    @Post('register')
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ['email', 'nombre', 'apellidos', 'password'],
        dto: CreateUserDto
    }))
    async register(@Body() createUserDto: CreateUserDto) {
        // If everything is ok, create the user
        const user = await this.userService.create(createUserDto);
        return { message: 'User registered', id: user.id };
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getMe(@GetUser() user: User) {
        return this.userService.getProfile(user.id);
    } 

    @Get('me/profile')
    @UseGuards(AuthGuard('jwt'))
    async getMyProfile(@GetUser() user: User) {
        return this.userService.getUserProfile(user.id);
    }

    @Put('change-password')
    @UseGuards(AuthGuard('jwt'))
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ['currentPassword', 'newPassword', 'confirmPassword'],
        dto: ChangePasswordDto
    }))
    async changePassword(@GetUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(user.id, changePasswordDto);
    }

    @Post('request-password-reset')
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ['email'],
        dto: RequestPasswordResetDto
    }))
    async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
        return this.authService.requestPasswordReset(requestPasswordResetDto);
    }

    @Post('reset-password')
    @UsePipes(new ValidateBodyPipe({
        requiredFields: ['token', 'newPassword'],
        dto: ResetPasswordDto
    }))
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Get('verify-reset-token/:token')
    async verifyResetToken(@Param('token') token: string) {
        return this.authService.verifyResetToken(token);
    }
}
