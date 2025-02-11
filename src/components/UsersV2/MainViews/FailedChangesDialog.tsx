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
import { ErrorOutline } from '@mui/icons-material';
import { PendingChange } from '../../../types/userDetailEdit.interface';
import {
  groupFailedChangesByType,
} from '../../../utilities/privilegeUtils';

interface FailedChangesDialogProps {
  open: boolean;
  onClose: () => void;
  failedChanges: [string | null, PendingChange][];
  onClear: () => void;
}

export function FailedChangesDialog({
  open,
  onClose,
  failedChanges,
  onClear,
}: FailedChangesDialogProps) {
  const groupedChanges = groupFailedChangesByType(failedChanges);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Failed Privilege Updates</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          The following privilege updates failed:
        </Typography>

        {/* Failed Additions */}
        {groupedChanges.POST && Object.keys(groupedChanges.POST).length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Failed Additions:
            </Typography>
            {Object.entries(groupedChanges.POST).map(([recordType, changes]) => (
              <Box key={`post-${recordType}`} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ ml: 2 }}>
                  {recordType}
                  :
                </Typography>
                <List dense>
                  {changes.map(([errorMessage, change]) => (
                    <ListItem key={change.payload.recordName + change.payload.roleName}>
                      <ListItemIcon>
                        <ErrorOutline color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Failed to add to ${change.recordType}`}
                        secondary={(
                          <>
                            <Typography component="span" display="block">
                              Record:
                              {' '}
                              {change.payload.recordName}
                            </Typography>
                            <Typography component="span" display="block">
                              Role:
                              {' '}
                              {change.payload.roleName}
                            </Typography>
                            <Typography component="span" display="block" color="error">
                              Error:
                              {' '}
                              {errorMessage}
                            </Typography>
                          </>
                                  )}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </>
        )}

        {/* Failed Removals */}
        {groupedChanges.DELETE && Object.keys(groupedChanges.DELETE).length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Failed Removals:
            </Typography>
            {Object.entries(groupedChanges.DELETE).map(([recordType, changes]) => (
              <Box key={`delete-${recordType}`} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ ml: 2 }}>
                  {recordType}
                  :
                </Typography>
                <List dense>
                  {changes.map(([errorMessage, change]) => (
                    <ListItem key={change.payload.recordName + change.payload.roleName}>
                      <ListItemIcon>
                        <ErrorOutline color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Failed to remove from ${change.recordType}`}
                        secondary={(
                          <>
                            <Typography component="span" display="block">
                              Record:
                              {' '}
                              {change.payload.recordName}
                            </Typography>
                            <Typography component="span" display="block">
                              Role:
                              {' '}
                              {change.payload.roleName}
                            </Typography>
                            <Typography component="span" display="block" color="error">
                              Error:
                              {' '}
                              {errorMessage}
                            </Typography>
                          </>
                                  )}
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
        <Button
          onClick={() => {
            onClose();
            onClear();
          }}
          variant="contained"
          color="primary"
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
