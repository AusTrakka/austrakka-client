import { UserSliceState } from '../app/userSlice';
import { RoleName } from './roles';

export enum PermissionLevel {
  CanClick = 'canClick',
  CanShow = 'canShow',
}

interface ResourcePriviledges {
  [PermissionLevel.CanShow]: string[];
  [PermissionLevel.CanClick]?: string[];
}

const componentPermissions: Readonly<Record<string, ResourcePriviledges>> = {
  'fields': {
    [PermissionLevel.CanShow]: [RoleName.AusTrakkaAdmin], // redundant, as admins can see everything
  },
  'users': {
    [PermissionLevel.CanShow]: [RoleName.AusTrakkaAdmin],
  },
  'project/tabs/datasettab': {
    [PermissionLevel.CanShow]: [RoleName.Viewer, RoleName.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RoleName.Viewer, RoleName.ProjectAnalyst],
  },
  'project/tabs/datasettab/datasettable': {
    [PermissionLevel.CanShow]: [RoleName.Viewer, RoleName.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RoleName.ProjectAnalyst],
  },
};

// Currently all roles are allocated via some group
// The component specifies the relevant group, the component permission domain,
// and the required permission level
export function hasPermission(
  user: UserSliceState,
  group: string,
  domain: string,
  permission: PermissionLevel,
): boolean {
  if (!user) return false;
  if (user.admin) {
    return true;
  }
  const userRoles = user.groupRolesByGroup[group] ?? [];
  const allowedRoles = componentPermissions[domain]?.[permission] ?? [];
  return userRoles.some(role => allowedRoles.includes(role));
}
