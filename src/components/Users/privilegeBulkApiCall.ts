import { UserRoleRecordPrivilegePost } from '../../types/dtos';
import { ResponseObject } from '../../types/responseObject.interface';
import {
  deleteOrgPrivilege, deleteTenantPrivilege,
  postOrgPrivilege,
  postTenantPrivilege,
} from '../../utilities/resourceUtils';
import { PendingChange } from '../../types/userDetailEdit.interface';
import { ResponseType } from '../../constants/responseType';

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
  token: string) => Promise<ResponseObject<any>>> = {
  'Organisation': deleteOrgPrivilege,
  'Tenant': deleteTenantPrivilege,
};

export async function processPrivilegeChanges(
  pendingChanges: PendingChange[],
  userGlobalId: string,
  token: string,
): Promise<[ string | null, PendingChange][]> {
  const failedChanges: [string | null, PendingChange][] = [];

  const processChange = async (change: PendingChange) => {
    try {
      if (change.type === 'POST' && postApiMap[change.recordType]) {
        const postBody: UserRoleRecordPrivilegePost = {
          assigneeGlobalId: userGlobalId,
          roleGlobalId: change.payload.roleGlobalId!,
        };
        const response = await postApiMap[change.recordType](
          change.payload.recordGlobalId!,
          postBody,
          token,
        );
        if (response.status !== ResponseType.Success) {
          failedChanges.push([response.message, change]);
        }
      } else if (change.type === 'DELETE' && deleteApiMap[change.recordType]) {
        const response = await deleteApiMap[change.recordType](
          change.payload.recordGlobalId!,
          change.payload.privilegeGlobalId!,
          token,
        );
        if (response.status !== ResponseType.Success) {
          failedChanges.push([response.message, change]);
        }
      } else {
        const errorMessage = `Unsupported change type: ${change.type} for record type: ${change.recordType}`;
        console.error(errorMessage); // eslint-disable-line no-console
        failedChanges.push([errorMessage, change]);
      }
    } catch (error) {
      const errorMessage = `Failed to process ${change.recordType} privilege for ${change.payload.recordName}: ${error}`;
      console.error(errorMessage); // eslint-disable-line no-console
      failedChanges.push([errorMessage, change]);
    }
  };

  await Promise.all(pendingChanges.map(processChange));

  return failedChanges;
}
