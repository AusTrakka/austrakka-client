import { GroupedPrivilegesByRecordTypeWithScopes } from '../types/dtos';

export function hasSuperUserRoleInType(groups: GroupedPrivilegesByRecordTypeWithScopes[]): boolean {
  const targetGroup = groups.find(group => group.recordType === 'Tenant');
  if (!targetGroup) {
    return false; // recordType not found
  }

  return targetGroup.recordRoles.some(recordRole =>
    recordRole.roles?.some(roleWithScopes =>
      roleWithScopes.role === 'SuperUser')) ||
        targetGroup.recordRoles.some(
          recordRole =>
            recordRole.roles?.some(roleWithScopes =>
              roleWithScopes.scopes.includes('method=*,/**')),
        );
}

export function hasScopeInRecord(
  groups: GroupedPrivilegesByRecordTypeWithScopes[],
  recordId: string,
  scope: string,
): boolean {
  // Find the record with the matching recordId
  const targetGroup = groups.find(group =>
    group.recordRoles.some(recordRole => recordRole.recordName === recordId));

  if (!targetGroup) {
    return false; // recordId not found
  }

  // Find the specific recordRole with the matching recordId
  const targetRecordRole = targetGroup.recordRoles
    .find(recordRole => recordRole.recordName === recordId);

  if (!targetRecordRole) {
    return false; // recordId not found within the specified group
  }

  // Check if any role within this recordRole contains the specified scope
  return targetRecordRole.roles.some(roleWithScopes =>
    roleWithScopes.scopes.includes(scope));
}
