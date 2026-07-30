import { Alert, Snackbar } from '@mui/material';

interface DocumentResponseToastProps {
  open: boolean;
  onClose: () => void;
  status: 'success' | 'error';
  message: string;
}

function DocumentResponseToast({ open, onClose, status, message }: DocumentResponseToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={2500}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={status === 'success' ? 'success' : 'error'}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default DocumentResponseToast;
