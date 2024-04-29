import React from 'react';
import { Chip, TableRow, TableCell, Box, Collapse, Stack, Typography } from '@mui/material';
import { Cancel, Lock } from '@mui/icons-material';
import { GroupRole } from '../../../types/dtos';

interface UserGroupRolesRowProps {
  groupName: string;
  roleNames: string[];
  isOpen: boolean;
  editing: boolean;
  userGroupRoles: GroupRole[];
  updateUserGroupRoles: (groupRoles: GroupRole[]) => void;
  locked: boolean;
}

function UserGroupRolesRow(props: UserGroupRolesRowProps) {
  const { groupName,
    roleNames,
    isOpen,
    editing,
    userGroupRoles,
    updateUserGroupRoles,
    locked } = props;

  const handleRoleDelete = (roleName: string) => {
    const updatedRoles = userGroupRoles.filter(
      (groupRole) => groupRole.role.name !== roleName,
    );
    updateUserGroupRoles(updatedRoles);
  };

  const handleColor = () => {
    if (editing && locked) {
      return 'default';
    }
    return editing ? 'error' : 'primary';
  };

  return (
    isOpen ? (
      <TableRow style={{ backgroundColor: '#F6F7F8' }}>
        <TableCell style={{ padding: 0, margin: 0 }} colSpan={2} hidden={!isOpen}>
          <Box sx={{ width: '100%' }}>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Stack direction="row" spacing={2} padding={2} alignItems="center" marginLeft="3em">
                <Typography variant="body2" width="15em">
                  {groupName}
                </Typography>
                {roleNames.map((roleName) => (
                  <Chip
                    key={`${groupName}-${roleName}`}
                    label={roleName}
                    color={handleColor()}
                    variant={editing ? 'filled' : 'outlined'}
                    onDelete={editing && !locked ? () => handleRoleDelete(roleName) : undefined}
                    deleteIcon={<Cancel />}
                    icon={editing && locked ? <Lock fontSize="small" /> : undefined}
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

export default UserGroupRolesRow;
