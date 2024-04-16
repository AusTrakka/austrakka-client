import React, { Dispatch, SetStateAction } from 'react';
import { TableRow, TableCell, IconButton, Typography } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import UserRoleGroupRow from './UserRoleGroupRow';
import { UserDetails, UserRoleGroup } from '../../../types/dtos';

interface RenderGroupedRolesAndGroupsProps {
  userRoleGroups: UserRoleGroup[];
  user: UserDetails;
  openRoleGroups: string[];
  setOpenRoleGroups: Dispatch<SetStateAction<string[]>>;
}

const sortUserRoleGroups = (userRoleGroups: UserRoleGroup[], user:UserDetails) => {
  const personalOrgs = userRoleGroups.filter(
    (group) =>
      group.group.organisation?.abbreviation === user.orgAbbrev,
  );

  const foriegnOrgs = userRoleGroups.filter(
    (group) =>
      group.group.organisation?.abbreviation !== user.orgAbbrev &&
        group.group.organisation?.abbreviation !== undefined,
  );

  const otherGroups = userRoleGroups.filter(
    (group) =>
      !personalOrgs.includes(group) &&
        !foriegnOrgs.includes(group) &&
        (group.group.organisation?.abbreviation === undefined ||
          group.group.organisation === null),
  );

  return [personalOrgs, foriegnOrgs, otherGroups];
};

function RenderGroupedRolesAndGroups(props: RenderGroupedRolesAndGroupsProps) {
  const { userRoleGroups, openRoleGroups, user, setOpenRoleGroups } = props;

  const [personalOrgs, foriegnOrgs, otherGroups] = sortUserRoleGroups(userRoleGroups, user);

  const handleRoleGroupToggle = (groupName: string) => {
    setOpenRoleGroups((prevOpenRoleGroups) =>
      (prevOpenRoleGroups.includes(groupName)
        ? prevOpenRoleGroups.filter((name) => name !== groupName)
        : [...prevOpenRoleGroups, groupName]));
  };

  const renderGroupHeader = (groupType: string, groupMapSize: number) => (
    <TableRow>
      <TableCell width="300em" colSpan={2}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => handleRoleGroupToggle(groupType)}
            disabled={groupMapSize === 0}
          >
            {openRoleGroups.includes(groupType) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
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

  const renderRoleGroups = (roleGroups: UserRoleGroup[], groupType: string) => {
    const groupMap = new Map<string, { roleNames: string[] }>();

    roleGroups.forEach((userGroup) => {
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
          <UserRoleGroupRow
            key={`${groupType}-${groupName}-${roleNames}`}
            groupName={groupName}
            roleNames={roleNames}
            isOpen={openRoleGroups.includes(groupType)}
          />
        ))}
      </>
    );
  };

  return (
    <>
      {renderRoleGroups(personalOrgs, 'Home Organisation')}
      {renderRoleGroups(foriegnOrgs, 'Other Organisations')}
      {renderRoleGroups(otherGroups, 'Projects and Other Groups')}
    </>
  );
}

export default RenderGroupedRolesAndGroups;
