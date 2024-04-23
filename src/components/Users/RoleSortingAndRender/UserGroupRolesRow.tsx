import React from 'react';
import { Chip, TableRow, TableCell, Box, Collapse, Stack, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';

interface UserGroupRolesRowProps {
  groupName: string;
  roleNames: string[];
  isOpen: boolean;
  editing: boolean;
  handleRoleDelete: (groupName: string, roleName: string) => void;
}

function UserGroupRolesRow(props: UserGroupRolesRowProps) {
  const { groupName, roleNames, isOpen, editing, handleRoleDelete } = props;

  return (
    isOpen ? (
      <TableRow>
        <TableCell style={{ padding: 0, margin: 0 }} colSpan={2} hidden={!isOpen}>
          <Box sx={{ width: '100%' }}>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Stack direction="row" spacing={2} padding={2} alignItems="center">
                <Typography variant="body2" width="15em">
                  {groupName}
                </Typography>
                {roleNames.map((roleName) => (
                  <Chip
                    key={`${groupName}-${roleName}`}
                    label={roleName}
                    color={editing ? 'error' : 'primary'}
                    variant={editing ? 'filled' : 'outlined'}
                    onDelete={editing ? () => handleRoleDelete(groupName, roleName) : undefined}
                    deleteIcon={<Cancel />}
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
