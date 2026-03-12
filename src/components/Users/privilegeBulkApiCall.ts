import { ResponseType } from '../../constants/responseType';
import type { UserRoleRecordPrivilegePost } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import type { PendingChange } from '../../types/userDetailEdit.interface';
import {
  deleteOrgPrivilege,
  deleteTenantPrivilege,
  postOrgPrivilege,
  postTenantPrivilege,
} from '../../utilities/resourceUtils';

const postApiMap: Record<
  string,
  (
    recordGlobalId: string,
    body: UserRoleRecordPrivilegePost,
    token: string,
    clientSessionId?: string,
  ) => Promise<ResponseObject<any>>
> = {
  Organisation: postOrgPrivilege,
  Tenant: postTenantPrivilege,
};

const deleteApiMap: Record<
  string,
  (
    recordGlobalId: string,
    assigneeGlobalId: string,
    roleGlobalId: string,
    token: string,
    clientSessionId?: string,
  ) => Promise<ResponseObject<any>>
> = {
  Organisation: deleteOrgPrivilege,
  Tenant: deleteTenantPrivilege,
};

export async function processPrivilegeChanges(
  pendingChanges: PendingChange[],
  userGlobalId: string,
  token: string,
  clientSessionId?: string,
): Promise<[string | null, PendingChange][]> {
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
          clientSessionId,
        );
        if (response.status !== ResponseType.Success) {
          failedChanges.push([response.message, change]);
        }
      } else if (change.type === 'DELETE' && deleteApiMap[change.recordType]) {
        const response = await deleteApiMap[change.recordType](
          change.payload.recordName,
          userGlobalId,
          change.payload.roleName,
          token,
          clientSessionId,
        );
        if (response.status !== ResponseType.Success) {
          failedChanges.push([response.message, change]);
        }
      } else {
        const errorMessage = `Unsupported change type: ${change.type} for record type: ${change.recordType}`;
        // biome-ignore lint/suspicious/noConsole: historic
        console.error(errorMessage);
        failedChanges.push([errorMessage, change]);
      }
    } catch (error) {
      const errorMessage = `Failed to process ${change.recordType} privilege for ${change.payload.recordName}: ${error}`;
      // biome-ignore lint/suspicious/noConsole: historic
      console.error(errorMessage);
      failedChanges.push([errorMessage, change]);
    }
  };

  await Promise.all(pendingChanges.map(processChange));

  return failedChanges;
}
