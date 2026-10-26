import type { UserSliceState } from '../app/userSlice';
import RecordTypes from '../constants/record-type.enum';
import { Roles } from '../permissions/roles';
import type {
  GroupedPrivilegesByRecordTypeWithScopes,
  PrivilegeWithRolesWithScopes,
} from '../types/dtos';

export function hasSuperUserRoleInType(groups: GroupedPrivilegesByRecordTypeWithScopes[]): boolean {
  return groups
    .filter((group) => group.recordType === RecordTypes.SYSTEM)
    .flatMap((group) => group.recordRoles)
    .filter((recordRole) => recordRole.recordName === RecordTypes.SYSTEM)
    .flatMap((recordRole) => recordRole.roles)
    .some((role) => role.roleName === Roles.SuperUser);
}

export function hasScopeInRecord(
  groupedPrivs: GroupedPrivilegesByRecordTypeWithScopes[],
  scope: string,
  recordName: string = '',
  recordType = RecordTypes.SYSTEM,
): boolean {
  if (recordType === RecordTypes.SYSTEM && recordName !== '') {
    throw new Error(`Cannot provide recordName with recordType of ${RecordTypes.SYSTEM}`);
  }
  if (recordType !== RecordTypes.SYSTEM && recordName === '') {
    throw new Error('Must provide recordName');
  }
  let targetRecordRole: PrivilegeWithRolesWithScopes | undefined;
  let notSystem = false;
  const targetGroup = groupedPrivs.find((group) => group.recordType === recordType);
  if (recordType === RecordTypes.SYSTEM) {
    targetRecordRole = targetGroup?.recordRoles[0];
  } else {
    notSystem = true;
    targetRecordRole = targetGroup?.recordRoles.find(
      (recordRole) => recordRole.recordName === recordName,
    );
  }
  if (!targetRecordRole) {
    return false; // recordId not found within the specified group
  }

  var systemGroup = groupedPrivs.find((group) => group.recordType === RecordTypes.SYSTEM);
  var systemRoles = systemGroup?.recordRoles[0];
  var targetHasRole = targetRecordRole.roles.some((roleWithScopes) =>
    roleWithScopes.scopes.includes(scope),
  );
  var systemHasRole = systemRoles?.roles.some((roleWithScopes) =>
    roleWithScopes.scopes.includes(scope),
  );

  if (notSystem) {
    return targetHasRole || systemHasRole || false;
  }
  return targetHasRole || false;
}

function hasRoleInRecord(
  privileges: GroupedPrivilegesByRecordTypeWithScopes[],
  role: Roles,
  recordName: string = '',
  recordType = RecordTypes.SYSTEM,
): boolean {
  if (recordType === RecordTypes.SYSTEM && recordName !== '') {
    throw new Error(`Cannot provide recordName with recordType of ${RecordTypes.SYSTEM}`);
  }
  if (recordType !== RecordTypes.SYSTEM && recordName === '') {
    throw new Error('Must provide recordName');
  }
  let targetRecordRole: PrivilegeWithRolesWithScopes | undefined;
  const targetGroup = privileges.find((priv) => priv.recordType === recordType);
  if (recordType === RecordTypes.SYSTEM) {
    targetRecordRole = targetGroup?.recordRoles[0];
  } else {
    targetRecordRole = targetGroup?.recordRoles.find(
      (recordRole) => recordRole.recordName === recordName,
    );
  }
  if (!targetRecordRole) {
    return false;
  }

  return targetRecordRole.roles.some((roleWithScopes) => roleWithScopes.roleName === role);
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
  return privsOfTypeWithScope(user, recordType, scope)
    .filter((recordRole) => recordRole.recordName !== excludeName)
    .map((recordRole) => recordRole.recordName);
}

export const privsOfTypeWithScope = (
  user: UserSliceState,
  recordType: RecordTypes,
  scope: string,
): PrivilegeWithRolesWithScopes[] => {
  return user.scopes
    .filter((group) => group.recordType === recordType)
    .flatMap((group) => group.recordRoles)
    .filter(
      (recordRole) =>
        user.superUser || recordRole.roles.some((r) => r.scopes.some((s) => s === scope)),
    );
};
