import { UserSliceState } from '../app/userSlice';
import { RoleName } from './roles';
import { hasScopeInRecord, hasSuperUserRoleInType } from '../utilities/accessTableUtils';

export enum PermissionLevel {
  CanClick = 'canClick', // maybe should be renamed to canInteract
  CanShow = 'canShow',
}

interface ResourcePrivileges {
  [PermissionLevel.CanShow]?: string[];
  [PermissionLevel.CanClick]?: string[];
}

const componentPermissions: Readonly<Record<string, ResourcePrivileges>> = {
  'fields': {
    [PermissionLevel.CanClick]: [RoleName.AusTrakkaAdmin],
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
  if (user.adminV2) {
    return true;
  }
  const userRoles = user.groupRolesByGroup[group] ?? [];
  const allowedRoles = componentPermissions[domain]?.[permission] ?? [];
  return userRoles.some(role => allowedRoles.includes(role));
}

// Hopefully this query isn't too cumbersome

// for the new system an example of a permission check lets say is the ability to edit a user
// so for this new function I would provid the user state. Which holds the submitters privileges
// and with this information I can check if the user has the permission to edit the user
// by then using this state to see if it has the permission to patch privileges and a 
// user on the default tenant record
export function hasPermissionV2(
  user: UserSliceState,
  recordId: string,
  scope: string,
): boolean {
  if (!user) return false;
  // This is if they are admin
  if (hasSuperUserRoleInType(user.scopes)) {
    return true;
  }
  
  return hasScopeInRecord(user.scopes, recordId, scope);
}
