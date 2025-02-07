import { PendingChange, RoleAssignments } from '../types/userDetailEdit.interface';
import { ResponseType } from '../constants/responseType';
import { ResponseObject } from '../types/responseObject.interface';
import {
  GroupedPrivilegesByRecordType, PrivilegeWithRoles,
  RecordRole,
  UserRoleRecordPrivilegePost,
} from '../types/dtos';
import {
  deleteOrgPrivilege,
  deleteTenantPrivilege,
  postOrgPrivilege,
  postTenantPrivilege,
} from './resourceUtils';

export const groupChangesByType = (changes: PendingChange[]) => changes.reduce((acc, change) => {
  const { type } = change;
  const { recordType } = change;

  if (!acc[type]) acc[type] = {};
  if (!acc[type][recordType]) acc[type][recordType] = [];

  acc[type][recordType].push(change);
  return acc;
}, {} as Record<'POST' | 'DELETE', Record<string, PendingChange[]>>);

const postApiMap: Record<string,
(recordGlobalId: string,
  body: UserRoleRecordPrivilegePost,
  token: string) => Promise<ResponseObject<any>>> = {
  'Organisation': postOrgPrivilege,
  'Tenant': postTenantPrivilege,
};

const deleteApiMap: Record<string,
(recordGlobalId: string,
  privilegeGlobalId: string,
  defaultTenantGlobalId: string,
  token: string) => Promise<ResponseObject<any>>> = {
  'Organisation': deleteOrgPrivilege,
  'Tenant': deleteTenantPrivilege,
};

export async function processPrivilegeChanges(
  pendingChanges: PendingChange[],
  defaultTenantGlobalId: string,
  userGlobalId: string,
  token: string,
): Promise<PendingChange[]> {
  const failedChanges: PendingChange[] = [];

  const processChange = async (change: PendingChange) => {
    try {
      if (change.type === 'POST' && postApiMap[change.recordType]) {
        const postBody: UserRoleRecordPrivilegePost = {
          owningTenantGlobalId: defaultTenantGlobalId,
          assigneeGlobalId: userGlobalId,
          roleGlobalId: change.payload.roleGlobalId!,
        };
        const response = await postApiMap[change.recordType](
          change.payload.recordGlobalId!,
          postBody,
          token,
        );
        if (response.status !== ResponseType.Success) {
          failedChanges.push(change);
        }
      } else if (change.type === 'DELETE' && deleteApiMap[change.recordType]) {
        const response = await deleteApiMap[change.recordType](
          change.payload.recordGlobalId!,
          change.payload.privilegeGlobalId!,
          defaultTenantGlobalId,
          token,
        );
        if (response.status !== ResponseType.Success) {
          failedChanges.push(change);
        }
      } else {
        // Maybe these errors can be stored and shown in the Dialog instead of just telling the user
        // what went wrong? Maybe why is useful to know what went wrong?
        // eslint-disable-next-line no-console
        console.error(`Unsupported change type: ${change.type} for record type: ${change.recordType}`);
        failedChanges.push(change);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to process ${change.recordType} privilege for ${change.payload.recordName}:`,
        error,
      );
      failedChanges.push(change);
    }
  };

  await Promise.all(pendingChanges.map(processChange));

  return failedChanges;
}

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
  const safePrev = JSON.parse(JSON.stringify(prev)) as GroupedPrivilegesByRecordType[];
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
