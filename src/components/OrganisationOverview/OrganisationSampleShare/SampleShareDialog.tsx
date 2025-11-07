import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Share, CheckCircle } from '@mui/icons-material';

interface SampleShareDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProject: string | null;
  selectedSamples: string[];
  onConfirm: () => void;
}

export default function SampleShareDialog({
  open,
  onClose,
  selectedProject,
  selectedSamples,
  onConfirm,
}: SampleShareDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Confirm Sample Sharing</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Share
          {' '}
          {selectedSamples.length}
          {' '}
          sample
          {selectedSamples.length !== 1 ? 's' : ''}
          {' '}
          with:
        </Typography>

        {/* Target Project */}
        <Box sx={{ my: 1, p: 2, borderRadius: 1 }}>
          <Typography variant="h6" color="primary">
            {selectedProject}
          </Typography>
        </Box>

        {/* Samples List */}
        <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <List dense>
            {selectedSamples.map((sampleId) => (
              <ListItem key={sampleId}>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText primary={sampleId} />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="success"
          startIcon={<Share />}
        >
          Confirm Share
        </Button>
      </DialogActions>
    </Dialog>
  );
}
