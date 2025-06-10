import { IsEnum, IsNotEmpty } from 'class-validator';
 
export class ChangeMemberRoleDto {
  @IsNotEmpty()
  @IsEnum(['member', 'admin'], { message: 'role-must-be-member-or-admin' })
  role: 'member' | 'admin';
} 