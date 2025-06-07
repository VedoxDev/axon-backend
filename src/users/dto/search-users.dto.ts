import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class SearchUsersDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(2, { message: 'search-query-too-short' })
    q: string;
} 