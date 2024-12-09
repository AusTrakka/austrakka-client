import { Cancel, Edit, Save } from '@mui/icons-material';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import React, { Dispatch, SetStateAction } from 'react';

interface EditButtonsProps {
  editing: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  onSave: () => void;
  onCancel: () => void;
  hasSavedChanges: boolean;
  canSee: () => boolean;
  onSaveLoading: boolean;
}

// Define the EditButtons component outside the UserDetail component
export default function EditButtonsV2(props : EditButtonsProps) {
  const { editing,
    setEditing,
    onSave,
    hasSavedChanges,
    onCancel,
    canSee,
    onSaveLoading } = props;

  if (editing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
        {onSaveLoading ? (
          <CircularProgress size={20} style={{ marginRight: '10px' }} />
        ) : (
          <Tooltip title="Save" placement="top" arrow>
            <span>
              <IconButton
                size="small"
                color="success"
                disabled={!hasSavedChanges}
                onClick={() => {
                  onSave(); // Call the onSave function when saving
                }}
              >
                <Save />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip title="Cancel" placement="top" arrow>
          <IconButton
            size="small"
            color="error"
            disabled={onSaveLoading}
            onClick={onCancel}
          >
            <Cancel />
          </IconButton>
        </Tooltip>
      </div>
    );
  }
  return canSee() ? (
    <Tooltip title="Edit" placement="top" arrow>
      <IconButton
        size="small"
        color="primary"
        onClick={() => setEditing(true)}
      >
        <Edit />
      </IconButton>
    </Tooltip>
  ) : null;
}
