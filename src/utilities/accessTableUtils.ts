import { GroupedPrivilegesByRecordTypeWithScopes, PrivilegeWithRolesWithScopes } from '../types/dtos';
import RecordTypes from '../constants/record-type.enum';

export function hasSuperUserRoleInType(groups: GroupedPrivilegesByRecordTypeWithScopes[]): boolean {
  const targetGroup = groups.find(group => group.recordType === RecordTypes.TENANT);
  if (!targetGroup) {
    return false; // recordType not found
  }

  return targetGroup.recordRoles.some(
    recordRole =>
      recordRole.roles?.some(roleWithScopes =>
      // TODO: This is not how you check for super user role.
      // Instead of looking at the method pattern, check for
      // privilegeLevel === 1.
        roleWithScopes.scopes.includes('method=*,/**')),
  );
}

export function hasScopeInRecord(
  groups: GroupedPrivilegesByRecordTypeWithScopes[],
  scope: string,
  recordName: string = '',
  recordType = 'Tenant',
): boolean {
  if (recordType === 'Tenant' && recordName !== '') {
    throw new Error('Cannot provide recordName with recordType of Tenant');
  }
  if (recordType !== 'Tenant' && recordName === '') {
    throw new Error('Must provide recordName');
  }
  let targetRecordRole: PrivilegeWithRolesWithScopes | undefined;
  const targetGroup = groups.find(group => group.recordType === recordType);
  if (recordType === 'Tenant') {
    targetRecordRole = targetGroup?.recordRoles[0];
  } else {
    targetRecordRole = targetGroup?.recordRoles
      .find(recordRole => recordRole.recordName === recordName);
  }
  if (!targetRecordRole) {
    return false; // recordId not found within the specified group
  }
  
  // Check if any role within this recordRole contains the specified scope
  return targetRecordRole.roles.some(roleWithScopes =>
    roleWithScopes.scopes.includes(scope));
}
