import { UserSliceState } from '../app/userSlice';
import { RoleName } from './roles';
import { hasScopeInRecord } from '../utilities/accessTableUtils';

export enum PermissionLevel {
  CanClick = 'canClick', // maybe should be renamed to canInteract
  CanShow = 'canShow',
}

interface ResourcePrivileges {
  [PermissionLevel.CanShow]?: string[];
  [PermissionLevel.CanClick]?: string[];
}

const componentPermissions: Readonly<Record<string, ResourcePrivileges>> = {
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

export function hasPermissionV2(
  user: UserSliceState,
  defaultTenantGlobalId: string,
  recordId: string,
  scope: string,
): boolean {
  if (!user) return false;
  // This is if they are admin
  if (user.adminV2) {
    return true;
  }
  
  if (!user.scopes || user.scopes.length === 0) {
    return false;
  }
  
  return hasScopeInRecord(user.scopes, recordId, scope, defaultTenantGlobalId);
}
