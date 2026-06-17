import type { UserSliceState } from '../app/userSlice';
import RecordTypes from '../constants/record-type.enum';
import { hasRoleInRecord, hasScopeInRecord } from '../utilities/accessTableUtils';
import { type Roles, RolesV1 } from './roles';

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
    [PermissionLevel.CanShow]: [RolesV1.TrakkaAdmin],
  },
  'project/tabs/datasettab': {
    [PermissionLevel.CanShow]: [RolesV1.GroupViewer, RolesV1.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RolesV1.GroupViewer, RolesV1.ProjectAnalyst],
  },
  'project/tabs/datasettab/datasettable': {
    [PermissionLevel.CanShow]: [RolesV1.GroupViewer, RolesV1.ProjectAnalyst],
    [PermissionLevel.CanClick]: [RolesV1.ProjectAnalyst],
  },
  'organisation/sample/share': {
    // if a button is hidden then when it is shown we expect it to be clickable
    [PermissionLevel.CanShow]: [RolesV1.Uploader, RolesV1.TrakkaAdmin],
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
  recordType = RecordTypes.SYSTEM,
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
  role: Roles,
  recordName: string = '',
  recordType = RecordTypes.SYSTEM,
): boolean {
  if (!user) return false;
  if (!role) return false;
  if (user.superUser) return true;
  if (!user.scopes || user.scopes.length === 0) return false;

  return hasRoleInRecord(user.scopes, role, recordName, recordType);
}

export function getRecordNamesWithScope(
  user: UserSliceState,
  recordType: RecordTypes,
  scope: string,
  excludeName?: string,
): string[] {
  const recordsOfType = user.scopes.filter((item) => item.recordType === recordType);
  const allRecordRoles = recordsOfType.flatMap((item) => item.recordRoles);

  const recordRolesWithScope = allRecordRoles.filter((recordRole) =>
    recordRole.roles.some((role) => role.scopes.includes(scope)),
  );

  // Optionally exclude a specific record by name (e.g. the current org)
  const filteredRecordRoles = excludeName
    ? recordRolesWithScope.filter((recordRole) => recordRole.recordName !== excludeName)
    : recordRolesWithScope;

  // Return the names of the records that have the required scope
  return filteredRecordRoles.map((recordRole) => recordRole.recordName);
}
