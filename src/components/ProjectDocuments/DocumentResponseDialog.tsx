import { CheckCircle, ErrorOutline } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

interface DocumentResponseDialogProps {
  open: boolean;
  onClose: () => void;
  status: 'success' | 'error';
  message: string;
}

function DocumentResponseDialog({ open, onClose, status, message }: DocumentResponseDialogProps) {
  const isSuccess = status === 'success';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {isSuccess ? (
          <CheckCircle fontSize="large" color="success" />
        ) : (
          <ErrorOutline fontSize="large" color="error" />
        )}
        <Typography color={isSuccess ? 'success' : 'error'} variant="h4" sx={{ marginBottom: 1 }}>
          {isSuccess ? 'Success' : 'Error'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color={isSuccess ? 'success' : 'error'}
          onClick={onClose}
          autoFocus
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DocumentResponseDialog;
