import React from 'react';
import {
  Box, Button,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon, ListItemText,
  Typography,
} from '@mui/material';
import { CheckCircle, RemoveCircle, Save } from '@mui/icons-material';
import { PendingChange } from '../../../types/userDetailEdit.interface';
import { groupChangesByType } from '../../../utilities/privilegeUtils';

interface ChangesDialogProps {
  open: boolean;
  onClose: () => void;
  pendingChanges: PendingChange[];
  onConfirm: () => void;
}

export function ChangesDialog({
  open,
  onClose,
  pendingChanges,
  onConfirm,
}: ChangesDialogProps) {
  const groupedChanges = groupChangesByType(pendingChanges);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Confirm Privilege Changes</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You are about to make the following changes:
        </Typography>

        {/* Additions Section */}
        {groupedChanges.POST && Object.keys(groupedChanges.POST).length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Additions:
          </Typography>
          {Object.entries(groupedChanges.POST).map(([recordType, changes]) => (
            <Box key={`post-${recordType}`} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ ml: 2 }}>
                {recordType}
                :
              </Typography>
              <List dense>
                {changes.map((change) => (
                  <ListItem key={change.payload.recordName + change.payload.roleName}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      secondary={`Record: ${change.payload.recordName}, Role: ${change.payload.roleName}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </>
        )}

        {/* Removals Section */}
        {groupedChanges.DELETE && Object.keys(groupedChanges.DELETE).length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Removals:
          </Typography>
          {Object.entries(groupedChanges.DELETE).map(([recordType, changes]) => (
            <Box key={`delete-${recordType}`} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ ml: 2 }}>
                {recordType}
                :
              </Typography>
              <List dense>
                {changes.map((change) => (
                  <ListItem key={change.payload.recordName + change.payload.roleName}>
                    <ListItemIcon>
                      <RemoveCircle color="error" />
                    </ListItemIcon>
                    <ListItemText
                      secondary={`Record: ${change.payload.recordName}, Role: ${change.payload.roleName}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          startIcon={<Save />}
        >
          Confirm Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
