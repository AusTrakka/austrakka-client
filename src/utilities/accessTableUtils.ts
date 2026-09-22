import RecordTypes from '../constants/record-type.enum';
import { Roles } from '../permissions/roles';
import type {
  GroupedPrivilegesByRecordTypeWithScopes,
  PrivilegeWithRolesWithScopes,
} from '../types/dtos';

export function hasSuperUserRoleInType(groups: GroupedPrivilegesByRecordTypeWithScopes[]): boolean {
  return groups
    .filter((x) => x.recordType === RecordTypes.SYSTEM)
    .map((x) => x.recordRoles)
    .reduce((x, y) => x.concat(y), [])
    .filter((x) => x.recordName === RecordTypes.SYSTEM)
    .map((x) => x.roles)
    .reduce((x, y) => x.concat(y), [])
    .some((x) => x.roleName === Roles.SuperUser);
}

export function hasScopeInRecord(
  groups: GroupedPrivilegesByRecordTypeWithScopes[],
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
  const targetGroup = groups.find((group) => group.recordType === recordType);
  if (recordType === RecordTypes.SYSTEM) {
    targetRecordRole = targetGroup?.recordRoles[0];
  } else {
    targetRecordRole = targetGroup?.recordRoles.find(
      (recordRole) => recordRole.recordName === recordName,
    );
  }
  if (!targetRecordRole) {
    return false; // recordId not found within the specified group
  }

  // Check if any role within this recordRole contains the specified scope
  return targetRecordRole.roles.some((roleWithScopes) => roleWithScopes.scopes.includes(scope));
}

export function hasRoleInRecord(
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
