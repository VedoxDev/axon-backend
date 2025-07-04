import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/user.entity';
import { EmailService } from 'src/common/services/email.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User]), // Add User repository for JwtStrategy
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '14d'}
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
})
export class AuthModule {}
