import type { UserSliceState } from '../app/userSlice';
import { hasRoleInRecord, hasScopeInRecord } from '../utilities/accessTableUtils';
import { RoleName, type RoleV2SeededName } from './roles';

export enum PermissionLevel {
  CanClick = 'canClick', // maybe should be renamed to canInteract
  CanShow = 'canShow',
}

interface ResourcePrivileges {
  [PermissionLevel.CanShow]?: string[];
  [PermissionLevel.CanClick]?: string[];
}

const componentPermissions: Readonly<Record<string, ResourcePrivileges>> = {
  users: {
    [PermissionLevel.CanShow]: [RoleName.TrakkaAdmin],
  },
  'project/tabs/datasettab': {
    [PermissionLevel.CanShow]: [RoleName.Viewer, RoleName.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RoleName.Viewer, RoleName.ProjectAnalyst],
  },
  'project/tabs/datasettab/datasettable': {
    [PermissionLevel.CanShow]: [RoleName.Viewer, RoleName.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RoleName.ProjectAnalyst],
  },
  'organisation/sample/share': {
    // if a button is hidden then when it is shown we expect it to be clickable
    [PermissionLevel.CanShow]: [RoleName.Uploader, RoleName.TrakkaAdmin],
  },
};

// Currently all roles are allocated via some group
// The component specifies the relevant group, the component permission domain,
// and the required permission level
export function hasPermission(
  user: UserSliceState,
  group: string,
  domain: string | null,
  permission: PermissionLevel,
): boolean {
  if (!user || !domain) return false;
  if (user.admin) {
    return true;
  }
  if (user.superUser) return true;
  const userRoles = user.groupRolesByGroup[group] ?? [];
  const allowedRoles = componentPermissions[domain]?.[permission] ?? [];
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function hasPermissionV2ByScope(
  user: UserSliceState,
  scope?: string,
  recordName: string = '',
  recordType = 'System',
): boolean {
  if (!user) return false;
  if (!scope) return false;
  // This is if they are admin
  if (user.superUser) {
    return true;
  }

  if (!user.scopes || user.scopes.length === 0) {
    return false;
  }

  return hasScopeInRecord(user.scopes, scope, recordName, recordType);
}

export function hasPermissionV2ByRole(
  user: UserSliceState,
  role: RoleV2SeededName,
  recordName: string = '',
  recordType = 'System',
): boolean {
  if (!user) return false;
  if (!role) return false;
  if (user.superUser) return true;
  if (!user.scopes || user.scopes.length === 0) return false;

  return hasRoleInRecord(user.scopes, role, recordName, recordType);
}
