import React from 'react';
import { Chip, TableRow, TableCell, Box, Collapse, Stack, Typography } from '@mui/material';

interface UserGroupRolesRowProps {
  groupName: string;
  roleNames: string[];
  isOpen: boolean;
}

function UserGroupRolesRow(props: UserGroupRolesRowProps) {
  const { groupName, roleNames, isOpen } = props;

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
                  <Chip key={`${groupName}-${roleName}`} label={roleName} color="primary" variant="outlined" />
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
