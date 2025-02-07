/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import UserRecordRolesRow from './UserRecordRolesRow';
import {
  GroupedPrivilegesByRecordType,
  PrivilegeWithRoles,
  RecordRole,
  RolesV2,
} from '../../../types/dtos';
import GroupHeaderRowV2 from './GroupHeaderRowV2';
import { useApi } from '../../../app/ApiContext';
import { getRoles } from '../../../utilities/resourceUtils';
import { ResponseType } from '../../../constants/responseType';
import { ResponseObject } from '../../../types/responseObject.interface';
import LoadingState from '../../../constants/loadingState';
import { RoleAssignments } from '../../../types/userDetailEdit.interface';

interface RenderGroupedRolesAndGroupsProps {
  userGroupedPrivileges: GroupedPrivilegesByRecordType[];
  openGroupRoles: string[];
  setOpenGroupRoles: Dispatch<SetStateAction<string[]>>;
  editing: boolean;
  onSelectionAdd: (
    recordType: string,
    AssignedRoles: RoleAssignments[],
  ) => void;
  onSelectionRemove: (
    role: RecordRole,
    recordType: string,
    recordName: string,
    recordGlobalId: string,
  ) => void;
}

const REQUIRED_RECORD_TYPES = ['Tenant', 'Organisation', 'Project', 'ProForma'];

function RenderGroupedPrivileges(props: RenderGroupedRolesAndGroupsProps) {
  const {
    userGroupedPrivileges,
    openGroupRoles,
    setOpenGroupRoles,
    editing,
    onSelectionAdd,
    onSelectionRemove,
  }
      = props;

  const [rolesForV2, setRolesForV2] = useState<RolesV2[] | null>(null);
  const [ugpFilledAndSorted, setUgpFilledAndSorted] =
      useState<GroupedPrivilegesByRecordType[]>(userGroupedPrivileges ?? []);
  const { token, tokenLoading } = useApi();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      const response: ResponseObject = await getRoles(token);
      if (response.status !== ResponseType.Success) {
        setErrorMessage(response.message);
        return;
      }
      const allRoles: RolesV2[] = response?.data ?? [];

      const rolesV2: RolesV2[] = allRoles.filter((role) =>
        role.allowedRootResourceTypes?.length).sort((a, b) => a.name.localeCompare(b.name));

      setRolesForV2(rolesV2);
    }

    if (token !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
      fetchRoles();
    }
  }, [token, tokenLoading]);

  useEffect(() => {
    if (!userGroupedPrivileges) return;

    // Filter out 'User' record type and track existing record types
    const existingTypes = new Set<string>();
    const processedPrivileges = userGroupedPrivileges
      .filter((group) => {
        if (group.recordType === 'User') return false;
        existingTypes.add(group.recordType);
        return true;
      })
      .map((group) => ({
        ...group,
        recordRoles: group.recordRoles
          .map((role) => ({
            ...role,
            // Could sort by privLevel I think maybe?
            roles: [...role.roles].sort((a, b) => a.roleName.localeCompare(b.roleName)),
          }))
          .sort((a, b) => a.recordName.localeCompare(b.recordName)),
      }));

    // Add missing record types with empty roles
    REQUIRED_RECORD_TYPES.forEach((type) => {
      if (!existingTypes.has(type)) {
        processedPrivileges.push({ recordType: type, recordRoles: [] });
      }
    });

    // Sort final list according to REQUIRED_RECORD_TYPES order
    processedPrivileges.sort(
      (a, b) =>
        REQUIRED_RECORD_TYPES.indexOf(a.recordType)
          - REQUIRED_RECORD_TYPES.indexOf(b.recordType),
    );

    setUgpFilledAndSorted(processedPrivileges);
  }, [userGroupedPrivileges]);

  const handleGroupRoleToggle = (groupName: string) => {
    setOpenGroupRoles((prevOpenGroupRoles) =>
      (prevOpenGroupRoles.includes(groupName)
        ? prevOpenGroupRoles.filter((name) => name !== groupName)
        : [...prevOpenGroupRoles, groupName]));
  };

  const getRolesForRecordType = (recordType: string) => {
    if (!rolesForV2) return [];
    return rolesForV2.filter((role) =>
      role.allowedRootResourceTypes
        .some((rt) => rt.name === recordType ||
                rt.name === 'All'));
  };

  const renderGroupRoles = (recordRoles: PrivilegeWithRoles[], recordType: string) => {
    const allowedRoles = getRolesForRecordType(recordType);
    return (
      <>
        <GroupHeaderRowV2
          key={recordType}
          empty={recordRoles.length === 0}
          recordType={recordType}
          openGroupRoles={openGroupRoles}
          handleGroupRoleToggle={handleGroupRoleToggle}
          editing={editing}
          rolesErrorMessage={errorMessage}
          roles={allowedRoles}
          onSelectionChange={onSelectionAdd}
        />
        {recordRoles.map(({ recordName, recordGlobalId, roles }) => (
          <UserRecordRolesRow
            recordType={recordType}
            key={`${recordName}-${roles.join('-')}`}
            recordName={recordName}
            recordGlobalId={recordGlobalId}
            recordRoles={roles}
            isOpen={openGroupRoles.includes(recordType)}
            editing={editing}
            onSelectionRemove={onSelectionRemove}
          />
        ))}
      </>
    );
  };

  return (
    <>
      {ugpFilledAndSorted.map((ugp: GroupedPrivilegesByRecordType) => (
        <React.Fragment key={ugp.recordType}>
          {renderGroupRoles(ugp.recordRoles, ugp.recordType)}
        </React.Fragment>
      ))}
    </>
  );
}

export default RenderGroupedPrivileges;
