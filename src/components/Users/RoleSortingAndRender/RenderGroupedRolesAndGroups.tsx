import React, { Dispatch, SetStateAction } from 'react';
import { TableRow, TableCell, IconButton, Typography } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import UserGroupRolesRow from './UserGroupRolesRow';
import { UserDetails, GroupRole } from '../../../types/dtos';

interface RenderGroupedRolesAndGroupsProps {
  userGroupRoles: GroupRole[];
  user: UserDetails;
  openGroupRoles: string[];
  setOpenGroupRoles: Dispatch<SetStateAction<string[]>>;
  editing: boolean;
  setUpdatedGroupRoles: Dispatch<SetStateAction<GroupRole[]>>;
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
    openGroupRoles,
    user,
    setOpenGroupRoles,
    editing,
    setUpdatedGroupRoles } = props;

  const [personalOrgs, foriegnOrgs, otherGroups] = sortGroupRoles(userGroupRoles, user);

  const handleGroupRoleToggle = (groupName: string) => {
    setOpenGroupRoles((prevOpenGroupRoles) =>
      (prevOpenGroupRoles.includes(groupName)
        ? prevOpenGroupRoles.filter((name) => name !== groupName)
        : [...prevOpenGroupRoles, groupName]));
  };

  const handleRoleDelete = (groupName: string, roleName: string) => {
    setUpdatedGroupRoles((prevUserRoleGroups) =>
      prevUserRoleGroups.reduce((acc, userGroup) => {
        if (userGroup.group.name === groupName) {
          if (userGroup.role.name === roleName) {
            const groupsWithSameName = prevUserRoleGroups.filter(
              (ug) => ug.group.name === groupName,
            );
            if (groupsWithSameName.length === 1) {
              return acc;
            }
          } else {
            // If the role doesn't match, add the original group object to the accumulator
            acc.push(userGroup);
          }
        } else {
          // If the group name doesn't match, add the original group object to the accumulator
          acc.push(userGroup);
        }
        return acc;
      }, [] as GroupRole[]));
  };

  const renderGroupHeader = (groupType: string, groupMapSize: number) => (
    <TableRow>
      <TableCell width="300em" colSpan={2}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => handleGroupRoleToggle(groupType)}
            disabled={groupMapSize === 0}
          >
            {openGroupRoles.includes(groupType) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
          {
          groupMapSize === 0 ? (
            <Typography variant="body2" sx={{ color: 'grey' }}>
              {groupType}
            </Typography>
          ) : (
            <Typography variant="body2">{groupType}</Typography>
          )
}
        </div>
      </TableCell>
    </TableRow>
  );

  const renderGroupRoles = (groupRoles: GroupRole[], groupType: string) => {
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
        {renderGroupHeader(groupType, groupMap.size)}
        {Array.from(groupMap).map(([groupName, { roleNames }]) => (
          <UserGroupRolesRow
            key={`${groupType}-${groupName}-${roleNames}`}
            groupName={groupName}
            roleNames={roleNames}
            isOpen={openGroupRoles.includes(groupType)}
            editing={editing}
            handleRoleDelete={handleRoleDelete}
          />
        ))}
      </>
    );
  };

  return (
    <>
      {renderGroupRoles(personalOrgs, 'Home Organisation')}
      {renderGroupRoles(foriegnOrgs, 'Other Organisations')}
      {renderGroupRoles(otherGroups, 'Projects and Other Groups')}
    </>
  );
}

export default RenderGroupedRolesAndGroups;
