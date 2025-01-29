/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import UserRecordRolesRow from './UserRecordRolesRow';
import { GroupedPrivilegesByRecordType, PrivilegeWithRoles, RolesV2 } from '../../../types/dtos';
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
  onSelectionChange: (
    recordType: string,
    AssignedRoles: RoleAssignments[],
  ) => void;
}

function RenderGroupedPrivileges(props: RenderGroupedRolesAndGroupsProps) {
  const {
    userGroupedPrivileges,
    openGroupRoles,
    setOpenGroupRoles,
    editing,
    onSelectionChange,
  }
      = props;

  const [rolesForV2, setRolesForV2] = useState<RolesV2[] | null>(null);
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
        role.allowedRootResourceTypes?.length);

      setRolesForV2(rolesV2);
    }

    if (token !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
      fetchRoles();
    }
  }, [token, tokenLoading]);

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
          recordType={recordType}
          openGroupRoles={openGroupRoles}
          handleGroupRoleToggle={handleGroupRoleToggle}
          editing={editing}
          rolesErrorMessage={errorMessage}
          roles={allowedRoles}
          onSelectionChange={onSelectionChange}
        />
        {recordRoles.map(({ recordName, roleNames }) => (
          <UserRecordRolesRow
            key={`${recordName}-${roleNames.join('-')}`}
            recordName={recordName}
            roleNames={roleNames}
            isOpen={openGroupRoles.includes(recordType)}
          />
        ))}
      </>
    );
  };

  return (
    <>
      {userGroupedPrivileges
        .slice() // Create a shallow copy to avoid mutating the original array
        .reverse()
        .map((ugp: GroupedPrivilegesByRecordType) => (
          <React.Fragment key={ugp.recordType}>
            {renderGroupRoles(ugp.recordRoles, ugp.recordType)}
          </React.Fragment>
        ))}
    </>
  );
}

export default RenderGroupedPrivileges;
