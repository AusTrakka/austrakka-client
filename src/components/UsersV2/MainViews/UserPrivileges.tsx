import { Box, Paper, Stack, Table, TableBody, TableContainer, Typography } from '@mui/material';
import React, { Dispatch, SetStateAction } from 'react';
import EditButtonsV2 from '../EditButtonsV2';
import RenderGroupedPrivileges from '../RoleSortingAndRender/RenderGroupedPrivileges';
import { GroupedPrivilegesByRecordType, RecordRole } from '../../../types/dtos';
import { RoleAssignments } from '../../../types/userDetailEdit.interface';

interface UserPrivilegesProps {
  editingPrivileges: boolean;
  setEditingPrivileges: Dispatch<SetStateAction<boolean>>;
  onPrivSave: () => void;
  handlePrivCancel: () => void;
  onSaveLoading: boolean;
  privHasChanges: boolean;
  canSee: () => boolean;
  editedPrivileges: GroupedPrivilegesByRecordType[] | null;
  openGroupRoles: string[];
  setOpenGroupRoles: Dispatch<SetStateAction<string[]>>;
  onSelectionRemove: (
    role: RecordRole,
    recordType: string,
    recordName: string,
    recordGlobalId: string) => void;
  onSelectionAdd: (
    recordType: string,
    assignedRoles:RoleAssignments[]) => void;
}

export default function UserPrivileges({
  editingPrivileges,
  setEditingPrivileges,
  onPrivSave,
  handlePrivCancel,
  onSaveLoading,
  privHasChanges,
  canSee,
  editedPrivileges,
  openGroupRoles,
  setOpenGroupRoles,
  onSelectionRemove,
  onSelectionAdd,
}: UserPrivilegesProps) {
  return (
    <Paper elevation={1} className="basic-info-table">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        display="flex"
        style={{ padding: '10px' }}
      >
        <Typography variant="h4" color="primary">
          Privileges
        </Typography>
        <EditButtonsV2
          editing={editingPrivileges}
          setEditing={setEditingPrivileges}
          onSave={onPrivSave}
          onCancel={handlePrivCancel}
          hasSavedChanges={privHasChanges}
          canSee={canSee}
          onSaveLoading={onSaveLoading}
        />
      </Stack>
      <TableContainer
        component={Box}
        className="table-container"
        sx={{ borderRadius: '6px' }}
      >
        <Table>
          <TableBody>
            <RenderGroupedPrivileges
              userGroupedPrivileges={editedPrivileges ?? []}
              openGroupRoles={openGroupRoles}
              setOpenGroupRoles={setOpenGroupRoles}
              editing={editingPrivileges}
              onSelectionRemove={onSelectionRemove}
              onSelectionAdd={onSelectionAdd}
            />
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
