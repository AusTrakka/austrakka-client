import React from 'react';
import { Chip, TableRow, TableCell, Box, Collapse, Stack, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { RecordRole } from '../../../types/dtos';

interface UserGroupRolesRowProps {
  recordType: string;
  recordName: string;
  recordGlobalId: string;
  recordRoles: RecordRole[];
  onSelectionRemove: (
    role: RecordRole,
    recordType: string,
    recordName: string,
    recordGlobalId: string,
  ) => void;
  isOpen: boolean;
  editing: boolean;
}

function UserRecordRolesRow(props: UserGroupRolesRowProps) {
  const { recordType,
    recordName,
    recordRoles,
    recordGlobalId,
    onSelectionRemove,
    isOpen,
    editing } = props;
  
  // TODO: come back to these functions as they relate to editing these chips
  
  // I need this to be a payload thing. where if the 
  // role is in the editied state and not the original state
  // then I can just delete it from the edited state.
  // However, if it is in the original state, then I need to
  // create a payload item for deletion.
  
  return (
    <TableRow key={recordName}>
      <TableCell
        style={{ padding: 0, margin: 0, border: 'none' }}
        colSpan={2}
      >
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Box sx={{ width: '100%' }}>
            <Stack
              direction="row"
              spacing={2}
              padding={2}
              alignItems="center"
              marginLeft="3em"
            >
              <Typography variant="body2" width="15em">
                {recordName}
              </Typography>

              {recordRoles.map((role) => (
                <Chip
                  key={`${recordName}-${role.roleName}`}
                  label={role.roleName}
                  color={editing ? 'error' : 'primary'}
                  variant={editing ? 'filled' : 'outlined'}
                  onDelete={
                editing
                  ? () =>
                    onSelectionRemove(
                      role,
                      recordType,
                      recordName,
                      recordGlobalId,
                    )
                  : undefined
              }
                  deleteIcon={<Cancel />}
                />
              ))}
            </Stack>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
}

export default UserRecordRolesRow;
