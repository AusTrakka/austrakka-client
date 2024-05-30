import { Cancel, Edit, Save } from '@mui/icons-material';
import { Button } from '@mui/material';
import React, { Dispatch, SetStateAction } from 'react';

interface EditButtonsProps {
  editing: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  onSave: () => void;
  onCancel: () => void;
  hasSavedChanges: boolean;
  canSee: () => boolean;
}

// Define the EditButtons component outside the UserDetail component
export default function EditButtons(props : EditButtonsProps) {
  const { editing,
    setEditing,
    onSave,
    hasSavedChanges,
    onCancel,
    canSee } = props;

  if (editing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
        <Button
          startIcon={<Save />}
          size="large"
          variant="contained"
          color="success"
          disabled={!hasSavedChanges}
          style={{ marginRight: '1rem' }}
          onClick={() => {
            setEditing(false);
            onSave(); // Call the onSave function when saving
          }}
        >
          Save
        </Button>
        <Button
          startIcon={<Cancel />}
          size="large"
          variant="contained"
          color="error"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    );
  }
  return canSee() ? (
    <Button
      startIcon={<Edit />}
      size="large"
      variant="contained"
      color="primary"
      onClick={() => setEditing(true)}
    >
      Edit
    </Button>
  ) : null;
}
