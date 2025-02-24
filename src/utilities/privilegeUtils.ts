import { PendingChange, RoleAssignments } from '../types/userDetailEdit.interface';
import {
  GroupedPrivilegesByRecordType, GroupedPrivilegesByRecordTypeWithScopes, PrivilegeWithRoles,
  RecordRole,
} from '../types/dtos';
import { ScopeDefinitions } from '../constants/scopes';

export const groupPendingChangesByType = (changes: PendingChange[]) =>
  changes.reduce((acc, change) => {
    const { type } = change;
    const { recordType } = change;

    if (!acc[type]) acc[type] = {};
    if (!acc[type][recordType]) acc[type][recordType] = [];

    acc[type][recordType].push(change);
    return acc;
  }, {} as Record<'POST' | 'DELETE', Record<string, PendingChange[]>>);

export const checkFetchUserScope =
    (scopes: GroupedPrivilegesByRecordTypeWithScopes[]) => scopes.some(
      scope =>
        scope.recordType === 'Tenant' &&
          scope.recordRoles.some(record =>
            record.roles.some(role =>
              role.scopes.includes(ScopeDefinitions.GET_USER_BY_GLOBAL_ID))),
    );

export const checkEditUserScopes =
    (scopes: GroupedPrivilegesByRecordTypeWithScopes[]) => scopes.some(
      scope =>
        scope.recordType === 'Tenant' &&
          scope.recordRoles.some(record =>
            record.roles.some(role =>
              role.scopes.includes(ScopeDefinitions.DELETE_USER_ACCESS) &&
                role.scopes.includes(ScopeDefinitions.GRANT_USER_ACCESS) &&
                role.scopes.includes(ScopeDefinitions.UPDATE_USER))),
    );

export const groupFailedChangesByType = (changes: [string | null, PendingChange][]) =>
  changes.reduce((acc, [errorMessage, change]) => {
    const { type } = change;
    const { recordType } = change;

    // Initialize the nested structure if it doesn't exist
    if (!acc[type]) acc[type] = {};
    if (!acc[type][recordType]) acc[type][recordType] = [];

    // Push the tuple [errorMessage, change] into the appropriate group
    acc[type][recordType].push([errorMessage ?? 'System Error', change]);
    return acc;
  }, {} as Record<'POST' | 'DELETE', Record<string, [string, PendingChange][]>>);

export const filterAssignedRoles = (
  recordType: string,
  assignedRoles: RoleAssignments[],
  editedPrivileges: GroupedPrivilegesByRecordType[] | null,
  pendingChanges: PendingChange[],
): RoleAssignments[] => assignedRoles.map(assignedRole => {
  const filteredRoles = assignedRole.roles.filter(role => {
    const existsInEditedPrivileges = editedPrivileges?.some(priv =>
      priv.recordType === recordType &&
        priv.recordRoles.some(recordRole =>
          recordRole.recordGlobalId === assignedRole.record.id &&
            recordRole.roles.some(existingRole => existingRole.roleName === role.name)));

    const existsInPendingChanges = pendingChanges.some(change =>
      change.type === 'POST' &&
        change.recordType === recordType &&
        change.payload.recordGlobalId === assignedRole.record.id &&
        change.payload.roleName === role.name);

    // Keep roles that **do not** exist in editedPrivileges or pendingChanges
    return !existsInEditedPrivileges && !existsInPendingChanges;
  });

  return {
    ...assignedRole,
    roles: filteredRoles,
  };
}).filter(assignedRole => assignedRole.roles.length > 0); // Remove only records with no roles left

export const updateEditedPrivileges = (
  prev: GroupedPrivilegesByRecordType[] | null,
  recordType: string,
  filteredAssignedRoles: RoleAssignments[],
): GroupedPrivilegesByRecordType[] => {
  const safePrev = JSON.parse(JSON.stringify(prev ?? [])) as GroupedPrivilegesByRecordType[];
  const existingPrivileges = new Map(safePrev.map(priv => [priv.recordType, priv]));

  const newRecordRoles: PrivilegeWithRoles[] = filteredAssignedRoles.map(assigned => ({
    recordName: assigned.record.abbrev,
    recordGlobalId: assigned.record.id,
    roles: assigned.roles.map(role => ({
      roleName: role.name,
      privilegeLevel: role.privilegeLevel,
      privilegeGlobalId: undefined,
    })),
  }));

  return existingPrivileges.has(recordType)
    ? safePrev.map(priv => {
      if (priv.recordType === recordType) {
        const existingRolesByRecord = new Map(priv.recordRoles
          .map(record => [record.recordName, record]));

        newRecordRoles.forEach(newRecord => {
          const existing = existingRolesByRecord.get(newRecord.recordName);
          if (existing) {
            existing.roles = [...new Set([...existing.roles, ...newRecord.roles])];
          } else {
            priv.recordRoles.push(newRecord);
          }
        });

        return priv;
      }
      return priv;
    })
    : [...safePrev, { recordType, recordRoles: newRecordRoles }];
};

export const updatePendingChanges = (
  pendingChanges: PendingChange[],
  recordType: string,
  filteredAssignedRoles: RoleAssignments[],
): PendingChange[] => filteredAssignedRoles.reduce((acc, assignedRole) => {
  const changes = [...acc];

  assignedRole.roles.forEach(role => {
    const deleteIndex = changes.findIndex(
      change =>
        change.type === 'DELETE' &&
              change.payload.recordGlobalId === assignedRole.record.id &&
              change.payload.roleName === role.name,
    );

    if (deleteIndex !== -1) {
      changes.splice(deleteIndex, 1);
    } else {
      changes.push({
        type: 'POST',
        recordType,
        payload: {
          recordGlobalId: assignedRole.record.id,
          roleGlobalId: role.globalId,
          recordName: assignedRole.record.name,
          roleName: role.name,
        },
      });
    }
  });

  return changes;
}, pendingChanges);

export const removeSelectionFromPrivileges = (
  prev: GroupedPrivilegesByRecordType[] | null,
  recordType: string,
  recordName: string,
  role: RecordRole,
): GroupedPrivilegesByRecordType[] => {
  if (!prev) return [];
  const prevCopy = JSON.parse(JSON.stringify(prev)) as GroupedPrivilegesByRecordType[];

  return prevCopy.reduce((acc, privilege) => {
    if (privilege.recordType !== recordType) {
      acc.push(privilege);
      return acc;
    }

    const updatedRecordRoles = privilege.recordRoles.reduce((records, record) => {
      if (record.recordName !== recordName) {
        records.push(record);
        return records;
      }

      const filteredRoles = record.roles.filter(r => r.roleName !== role.roleName);

      if (filteredRoles.length > 0) {
        records.push({ ...record, roles: filteredRoles });
      }

      return records;
    }, [] as PrivilegeWithRoles[]);

    if (updatedRecordRoles.length > 0) {
      acc.push({ ...privilege, recordRoles: updatedRecordRoles });
    }

    return acc;
  }, [] as GroupedPrivilegesByRecordType[]);
};

export const updatePendingChangesForRemoval = (
  pendingChanges: PendingChange[],
  recordType: string,
  recordGlobalId: string,
  recordName: string,
  role: RecordRole,
): PendingChange[] => {
  // If a user adds a role and then removes it, the POST change will be in the pendingChanges
  // array and instead of adding a DELETE change, POST will be removed from the pendingChanges
  const postIndex = pendingChanges.findIndex(
    change =>
      change.type === 'POST' &&
          change.payload.recordGlobalId === recordGlobalId &&
          change.payload.roleName === role.roleName,
  );

  if (postIndex !== -1) {
    const updatedChanges = [...pendingChanges];
    updatedChanges.splice(postIndex, 1);
    return updatedChanges;
  }

  return [
    ...pendingChanges,
    {
      type: 'DELETE',
      recordType,
      payload: {
        recordName,
        recordGlobalId,
        roleName: role.roleName,
        privilegeGlobalId: role.privilegeGlobalId,
      },
    },
  ];
};
