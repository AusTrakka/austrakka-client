/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction } from 'react';
import { forEach } from 'react-bootstrap/ElementChildren';
import UserRecordRolesRow from './UserRecordRolesRow';
import {
  User,
  GroupRole,
  Group,
  Role,
  GroupedPrivilegesByRecordTypeWithScopes,
  GroupedPrivilegesByRecordType, PrivilegeWithRoles,
} from '../../../types/dtos';
import GroupHeaderRowV2 from './GroupHeaderRowV2';
import { GroupHeadings } from '../Enums/GroupHeadings';
import { sortGroupRoles } from '../groupSortingV2';

interface RenderGroupedRolesAndGroupsProps {
  userGroupedPrivileges: GroupedPrivilegesByRecordType[];
  user: User;
  openGroupRoles: string[];
  setOpenGroupRoles: Dispatch<SetStateAction<string[]>>;
}

function RenderGroupedPrivileges(props: RenderGroupedRolesAndGroupsProps) {
  const { userGroupedPrivileges,
    openGroupRoles,
    user,
    setOpenGroupRoles } = props;

  const handleGroupRoleToggle = (groupName: string) => {
    setOpenGroupRoles((prevOpenGroupRoles) =>
      (prevOpenGroupRoles.includes(groupName)
        ? prevOpenGroupRoles.filter((name) => name !== groupName)
        : [...prevOpenGroupRoles, groupName]));
  };

  const renderGroupRoles = (recordRoles: PrivilegeWithRoles[], recordType: string) => (
    <>
      <GroupHeaderRowV2
        key={recordType}
        recordType={recordType}
        openGroupRoles={openGroupRoles}
        handleGroupRoleToggle={handleGroupRoleToggle}
      />
      {recordRoles.map(({ recordName, roleNames }, id) => (
        <UserRecordRolesRow
          key={`${recordType}-${roleNames.join('-')}`}
          recordName={recordName}
          roleNames={roleNames}
          isOpen={openGroupRoles.includes(recordType)}
        />
      ))}
    </>
  );

  return (
    <>
      {userGroupedPrivileges.map((ugp: GroupedPrivilegesByRecordType) => (
        <React.Fragment key={ugp.recordType}>
          {renderGroupRoles(ugp.recordRoles, ugp.recordType)}
        </React.Fragment>
      ))}
    </>
  );
}

export default RenderGroupedPrivileges;
