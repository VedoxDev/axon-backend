import { Controller, Post, Body, BadRequestException, Get, UseGuards } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly userService: UsersService,
        private readonly authService: AuthService
    ) {}

    @Post('login')
    async login(@Body() body: Partial<LoginDto>) {
        
        // Validate required fields
        const requiredFields = ['email', 'password'];

        for (const field of requiredFields) {
            if (!body[field]) {
                throw new BadRequestException(`${field}-required`);
            }
        }

        // Validate data on DTO
        const loginDto: LoginDto = plainToInstance(LoginDto, body);
        const errors = validateSync(loginDto);

        // If there are errors, throw them
        if (errors.length > 0) {
            throw new BadRequestException(errors.flatMap(e => Object.values(e.constraints ?? {})))
        }

        // Validate user credentials
        const user = await this.authService.validateUser(loginDto);
        
        // Generate JWT token
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body: Partial<CreateUserDto>) {

        // Validate required fields
        const requiredFields = ['email', 'nombre', 'apellidos', 'password'];

        for (const field of requiredFields) {
            if (!body[field]) {
                throw new BadRequestException(`${field}-required`);
            }
        }

        // Validate data on DTO
        const createUserDto: CreateUserDto = plainToInstance(CreateUserDto, body);
        const errors = validateSync(createUserDto);

        // If there are errors, throw them  
        if (errors.length > 0) {
            throw new BadRequestException(errors.flatMap(e => Object.values(e.constraints ?? {})));
        }

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
