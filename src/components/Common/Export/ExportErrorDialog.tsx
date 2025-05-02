import React, { FC } from 'react';
import { Alert, AlertTitle, Dialog, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface ExportErrorDialogProps {
  open: boolean,
  onClose: () => void,
}

const ExportErrorDialog: FC<ExportErrorDialogProps> = (props) => (
  <>
    <Dialog onClose={props.onClose} open={props.open}>
      <Alert severity="error" sx={{ padding: 3 }}>
        <IconButton
          aria-label="close"
          onClick={props.onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
        <AlertTitle sx={{ paddingBottom: 1 }}>
          <strong>Your data could not be exported to CSV.</strong>
        </AlertTitle>
        There has been an error exporting your data to CSV.
        <br />
        Please try again later, or contact the
        {' '}
        {import.meta.env.VITE_BRANDING_NAME}
        {' '}
        team.
      </Alert>
    </Dialog>
  </>
);

export default ExportErrorDialog;
