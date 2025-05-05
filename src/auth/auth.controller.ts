import { Controller, Post, Body, Get, UseGuards, UsePipes } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';
import { ValidateBodyPipe } from 'src/common/pipes/validate-body.pipe';

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
}
