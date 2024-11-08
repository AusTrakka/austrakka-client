import React from 'react';
import { Chip, TableRow, TableCell, Box, Collapse, Stack, Typography } from '@mui/material';
import { Cancel, Lock } from '@mui/icons-material';
import { GroupRole } from '../../../types/dtos';
import { GroupHeadings } from '../Enums/GroupHeadings';

interface UserGroupRolesRowProps {
  recordName: string;
  roleNames: string[];
  isOpen: boolean;
}

function UserRecordRolesRow(props: UserGroupRolesRowProps) {
  const { recordName,
    roleNames,
    isOpen } = props;

  // locked now equals true if the type of group is personal orgs and its everything but
  // the owner group for the subset of groups in this type. which will be locked.

  /*
  const isItLocked = () => {
    switch (recordType) {
      case GroupHeadings.HOME_ORG:
        return !recordName.endsWith('-Owner');
      default:
        return false;
    }
  };
*/

  // const locked = isItLocked();

  /*
  const handleRoleDelete = (roleName: string) => {
    const updatedRoles = userGroupRoles.filter(
      (groupRole) => {
        if (groupRole.group.name === recordName) {
          return !groupRole.role.name.includes(roleName);
        }
        return true;
      },
    );
    updateUserGroupRoles(updatedRoles);
  };
*/

  /*
  const handleColor = () => {
    if (editing && locked) {
      return 'default';
    }
    return editing ? 'error' : 'primary';
  };
*/

  return (
    isOpen ? (
      <TableRow style={{ backgroundColor: 'var(--primary-grey)' }}>
        <TableCell style={{ padding: 0, margin: 0 }} colSpan={2} hidden={!isOpen}>
          <Box sx={{ width: '100%' }}>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Stack direction="row" spacing={2} padding={2} alignItems="center" marginLeft="3em">
                <Typography variant="body2" width="15em">
                  {recordName}
                </Typography>
                {roleNames.map((roleName) => (
                  <Chip
                    key={`${recordName}-${roleName}`}
                    label={roleName}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Collapse>
          </Box>
        </TableCell>
      </TableRow>
    )
      : null
  );
}

export default UserRecordRolesRow;
