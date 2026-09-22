import type { UserSliceState } from '../app/userSlice';
import RecordTypes from '../constants/record-type.enum';
import { hasRoleInRecord, hasScopeInRecord } from '../utilities/accessTableUtils';
import type { Roles } from './roles';

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
