import { Controller, Get, Query, UseGuards, Param, BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // Search users endpoint for fast user lookup
    @Get('search')
    @UseGuards(AuthGuard("jwt"))
    async searchUsers(
        @Query('q') query: string,
        @Query('limit') limit?: string
    ) {
        // Validate query parameter
        if (!query || query.trim().length < 2) {
            return {
                users: [],
                message: 'search-query-too-short'
            };
        }

        const searchLimit = limit ? Math.min(parseInt(limit), 50) : 10; // Max 50 results
        const users = await this.usersService.searchUsers(query, searchLimit);

        return {
            users,
            total: users.length,
            query: query.trim()
        };
    }

    // Get user profile by ID
    @Get(':userId/profile')
    @UseGuards(AuthGuard("jwt"))
    async getUserProfile(
        @Param('userId', new ParseUUIDPipe({ 
            version: '4', 
            errorHttpStatusCode: 400,
            exceptionFactory: () => new BadRequestException('invalid-user-id')
        })) userId: string
    ) {
        return this.usersService.getUserProfile(userId);
    }
} 