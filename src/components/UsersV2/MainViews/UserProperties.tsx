import React, { Dispatch, SetStateAction } from 'react';
import {
  Paper,
  Stack,
  Typography,
  TableContainer,
  Table,
  TableBody,
  Box,
  Alert,
} from '@mui/material';
import { UserV2 } from '../../../types/dtos';
import EditButtonsV2 from '../EditButtonsV2';
import EditableRow from '../RowRender/EditableRow';
import BasicRow from '../RowRender/BasicRow';

interface UserPropertiesProps {
  user: UserV2;
  editingBasic: boolean;
  setEditingBasic: Dispatch<SetStateAction<boolean>>;
  editedValues: UserV2 | null;
  setEditedValues: Dispatch<SetStateAction<UserV2 | null>>;
  readableNames: Record<string, string>;
  onSave: () => Promise<void>;
  handleCancel: () => void;
  hasChanges: boolean;
  canSee: () => boolean;
  onSaveLoading: boolean;
  errMsg: string | null;
  nonDisplayFields: string[];
}

export default function UserProperties(props: UserPropertiesProps) {
  const {
    user,
    editingBasic,
    setEditingBasic,
    onSave,
    handleCancel,
    hasChanges,
    canSee,
    onSaveLoading,
    errMsg,
    nonDisplayFields,
    readableNames,
    editedValues,
    setEditedValues,
  } = props;

  const renderRow = (field: keyof UserV2, value: any) => {
    if (editingBasic) {
      return (
        <EditableRow
          key={field}
          field={field}
          detailValue={value}
          editedValues={editedValues}
          setEditedValues={setEditedValues}
          readableNames={readableNames}
        />
      );
    }
    return (
      <BasicRow
        key={field}
        field={field}
        value={value}
        readableNames={readableNames}
      />
    );
  };
  
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
          User Details
        </Typography>
        <EditButtonsV2
          editing={editingBasic}
          setEditing={setEditingBasic}
          onSave={onSave}
          onCancel={handleCancel}
          hasSavedChanges={hasChanges}
          canSee={canSee}
          onSaveLoading={onSaveLoading}
        />
      </Stack>
      {errMsg && <Alert severity="error">{errMsg}</Alert>}
      <TableContainer component={Box}>
        <Table sx={{ borderBottom: 'none' }}>
          <TableBody>
            {Object.entries(user).map(([field, value]) => {
              if ((typeof value !== 'object' || value === null) && !nonDisplayFields.includes(field)) {
                return renderRow(field as keyof UserV2, value);
              }
              return null;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
