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
        // what went wrong? Maybe the 'why' is useful?
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
