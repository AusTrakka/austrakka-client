import { GroupedPrivilegesByRecordTypeWithScopes, PrivilegeWithRolesWithScopes } from '../types/dtos';

export function hasSuperUserRoleInType(groups: GroupedPrivilegesByRecordTypeWithScopes[]): boolean {
  const targetGroup = groups.find(group => group.recordType === 'Tenant');
  if (!targetGroup) {
    return false; // recordType not found
  }

  return targetGroup.recordRoles.some(
    recordRole =>
      recordRole.roles?.some(roleWithScopes =>
        roleWithScopes.scopes.includes('method=*,/**')),
  );
}

export function hasScopeInRecord(
  groups: GroupedPrivilegesByRecordTypeWithScopes[],
  recordName: string,
  scope: string,
): boolean {
  // Find the record with the matching recordId
  let targetGroup = groups.find(group =>
    group.recordRoles.some(recordRole => recordRole.recordName === recordName));

  let targetRecordRole: PrivilegeWithRolesWithScopes | undefined;
  
  if (!targetGroup) {
    targetGroup = groups.find(group => group.recordType === 'Tenant');
    targetRecordRole = targetGroup!.recordRoles
      .find(recordRole => recordRole.recordName === 'Default Tenant');
  } else {
    targetRecordRole = targetGroup.recordRoles
      .find(recordRole => recordRole.recordName === recordName);
  }
  if (!targetRecordRole) {
    return false; // recordId not found within the specified group
  }
  
  // Check if any role within this recordRole contains the specified scope
  return targetRecordRole.roles.some(roleWithScopes =>
    roleWithScopes.scopes.includes(scope));
}
