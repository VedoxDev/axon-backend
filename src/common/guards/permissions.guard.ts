import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
    Inject,
    BadRequestException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
  import { Permission } from '../enums/permission.enum';
  import { RolePermissionMap } from '../permissions/role-permission.map';
  import { ProjectMember } from 'src/projects/entities/project-member.entity';
  import { DataSource } from 'typeorm';
  
  @Injectable()
  export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector, private dataSource: DataSource) {}
  
    private isValidUUID(uuid: string): boolean {
      const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
      return uuidV4Regex.test(uuid);
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );
  
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      const projectId = request.params.projectId || request.body.projectId;
      if (!projectId) throw new ForbiddenException('missing-project-id.');
      
      if (!this.isValidUUID(projectId)) {
        throw new BadRequestException('invalid-project-id');
      }
  
      const member = await this.dataSource
        .getRepository(ProjectMember)
        .findOne({
          where: {
            user: { id: user.id },
            project: { id: projectId },
          },
        });
  
      if (!member) throw new ForbiddenException('not-a-member.');
  
      const permissions = RolePermissionMap[member.role] || [];
      const hasAll = requiredPermissions.every((p) => permissions.includes(p));
      if (!hasAll) throw new ForbiddenException('insufficient-permissions.');
  
      return true;
    }
  }