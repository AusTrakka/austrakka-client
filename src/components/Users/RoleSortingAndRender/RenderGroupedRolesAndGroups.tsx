/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction } from 'react';
import UserGroupRolesRow from './UserGroupRolesRow';
import { UserDetails, GroupRole, Group, Role } from '../../../types/dtos';
import GroupHeaderRow from './GroupRowHeader';

interface RenderGroupedRolesAndGroupsProps {
  userGroupRoles: GroupRole[];
  user: UserDetails;
  setOpenDupSnackbar: Dispatch<SetStateAction<boolean>>;
  openGroupRoles: string[];
  setOpenGroupRoles: Dispatch<SetStateAction<string[]>>;
  editing: boolean;
  updateUserGroupRoles: (groupRoles: GroupRole[]) => void;
  allGroups: Group[]
  allRoles: Role[];
}

const sortGroupRoles = (userGroupRoles: GroupRole[], user:UserDetails) => {
  const personalOrgs = userGroupRoles.filter(
    (group) =>
      group.group.organisation?.abbreviation === user.orgAbbrev,
  );

  const foriegnOrgs = userGroupRoles.filter(
    (group) =>
      group.group.organisation?.abbreviation !== user.orgAbbrev &&
        group.group.organisation?.abbreviation !== undefined,
  );

  const otherGroups = userGroupRoles.filter(
    (group) =>
      !personalOrgs.includes(group) &&
        !foriegnOrgs.includes(group) &&
        (group.group.organisation?.abbreviation === undefined ||
          group.group.organisation === null),
  );

  return [personalOrgs, foriegnOrgs, otherGroups];
};

function RenderGroupedRolesAndGroups(props: RenderGroupedRolesAndGroupsProps) {
  const { userGroupRoles,
    setOpenDupSnackbar,
    openGroupRoles,
    user,
    setOpenGroupRoles,
    editing,
    updateUserGroupRoles,
    allRoles,
    allGroups } = props;

  const [personalOrgs, foriegnOrgs, otherGroups] = sortGroupRoles(userGroupRoles, user);

  const handleGroupRoleToggle = (groupName: string) => {
    setOpenGroupRoles((prevOpenGroupRoles) =>
      (prevOpenGroupRoles.includes(groupName)
        ? prevOpenGroupRoles.filter((name) => name !== groupName)
        : [...prevOpenGroupRoles, groupName]));
  };

  const renderGroupRoles = (groupRoles: GroupRole[], groupType: string, locked: boolean) => {
    const groupMap = new Map<string, { roleNames: string[] }>();

    groupRoles.forEach((userGroup) => {
      const groupName = userGroup.group.name;
      const roleName = userGroup.role.name;

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, { roleNames: [roleName] });
      } else {
        groupMap.get(groupName)?.roleNames.push(roleName);
      }
    });

    return (
      <>
        <GroupHeaderRow
          groupType={groupType}
          groupMapSize={groupMap.size}
          setOpenDupSnackbar={setOpenDupSnackbar}
          user={user}
          allGroups={allGroups}
          allRoles={allRoles}
          editing={editing}
          openGroupRoles={openGroupRoles}
          handleGroupRoleToggle={handleGroupRoleToggle}
          existingGroupRoles={userGroupRoles}
          updateUserGroupRoles={updateUserGroupRoles}
        />
        {Array.from(groupMap).map(([groupName, { roleNames }]) => (
          <UserGroupRolesRow
            key={`${groupType}-${groupName}-${roleNames}`}
            groupName={groupName}
            roleNames={roleNames}
            isOpen={openGroupRoles.includes(groupType)}
            editing={editing}
            userGroupRoles={userGroupRoles}
            updateUserGroupRoles={updateUserGroupRoles}
            locked={locked}
          />
        ))}
      </>
    );
  };

  return (
    <>
      {renderGroupRoles(personalOrgs, 'Home Organisation', true)}
      {renderGroupRoles(foriegnOrgs, 'Other Organisations', false)}
      {renderGroupRoles(otherGroups, 'Projects and Other Groups', false)}
    </>
  );
}

export default RenderGroupedRolesAndGroups;
