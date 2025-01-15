import { UserSliceState } from '../app/userSlice';
import { RoleName } from './roles';
import { hasScopeInRecord } from '../utilities/accessTableUtils';
import RecordType from '../constants/record-type.enum';

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
  domain: string | null,
  permission: PermissionLevel,
): boolean {
  if (!user || !domain) return false;
  if (user.admin) {
    return true;
  }
  const userRoles = user.groupRolesByGroup[group] ?? [];
  const allowedRoles = componentPermissions[domain]?.[permission] ?? [];
  return userRoles.some(role => allowedRoles.includes(role));
}

export function hasScopes(
    user: UserSliceState, 
    recordId: string,
    scopes: string[] = []
): boolean 
{
  if (!user || !user.scopes) return false;
  
  const tenantScopes = user.scopes
      .filter(scope => scope.recordType === RecordType.TENANT)
      .filter(scope => scope.recordRoles
          ?.some(recordRole => recordRole.recordGlobalId === recordId &&
                               recordRole.roles.some(role => scopes.some(scope => role.scopes.includes(scope)))));

  return tenantScopes.length > 0;
}

export function hasPermissionV2(
  user: UserSliceState,
  recordId: string,
  scope: string,
): boolean {
  if (!user) return false;
  // This is if they are admin
  if (user.adminV2) {
    return true;
  }
  
  return hasScopeInRecord(user.scopes, recordId, scope, user.defaultTenantName);
}
