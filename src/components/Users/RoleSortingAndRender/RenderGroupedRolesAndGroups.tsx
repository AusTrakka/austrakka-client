import React, { Dispatch, SetStateAction } from 'react';
import { TableRow, TableCell, IconButton, Typography } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import UserGroupRolesRow from './UserGroupRolesRow';
import { User, GroupRole } from '../../../types/dtos';

interface RenderGroupedRolesAndGroupsProps {
  userGroupRoles: GroupRole[];
  user: User;
  openGroupRoles: string[];
  setOpenGroupRoles: Dispatch<SetStateAction<string[]>>;
}

const sortGroupRoles = (userGroupRoles: GroupRole[], user:User) => {
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
  const { userGroupRoles, openGroupRoles, user, setOpenGroupRoles } = props;

  const [personalOrgs, foriegnOrgs, otherGroups] = sortGroupRoles(userGroupRoles, user);

  const handleGroupRoleToggle = (groupName: string) => {
    setOpenGroupRoles((prevOpenGroupRoles) =>
      (prevOpenGroupRoles.includes(groupName)
        ? prevOpenGroupRoles.filter((name) => name !== groupName)
        : [...prevOpenGroupRoles, groupName]));
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
