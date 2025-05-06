import { Permission } from '../enums/permission.enum';

export const RolePermissionMap: Record<string, Permission[]> = {
  owner: [
    Permission.VIEW_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.MANAGE_MEMBERS,
    Permission.CREATE_TASK,
    Permission.ASSIGN_TASK,
    Permission.DELETE_PROJECT,
    Permission.MANAGE_SECTIONS,
  ],
  admin: [
    Permission.VIEW_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.MANAGE_MEMBERS,
    Permission.CREATE_TASK,
    Permission.ASSIGN_TASK,
    Permission.MANAGE_SECTIONS,
  ],
  member: [
    Permission.VIEW_PROJECT,
    Permission.CREATE_TASK,
  ],
};