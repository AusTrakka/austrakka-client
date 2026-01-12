import React from 'react';
import { Close } from '@mui/icons-material';
import { Alert, Dialog, IconButton, Typography } from '@mui/material';

interface ShareBlockedProps {
  canShare: boolean,
  openShareBlocked: boolean,
  setOpenShareBlocked: (open: boolean) => void,
  selectedIdsLength: number,
}

export function ShareBlocked(props: ShareBlockedProps) {
  const { canShare, openShareBlocked, selectedIdsLength, setOpenShareBlocked } = props;

  let content;
  if (!canShare) {
    content = (
      <>
        <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
          Incorrect permissions
        </Typography>
        <Typography variant="body1">
          Only users with
          {' '}
          <strong>Uploader</strong>
          {' '}
          permissions for the organisation&apos;s Owner group can share samples.
        </Typography>
      </>
    );
  } else if (selectedIdsLength === 0) {
    content = (
      <>
        <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
          No samples selected
        </Typography>
        <Typography variant="body1">
          Please select at least one sample in the table to share.
        </Typography>
      </>
    );
  } else {
    content = (
      <>
        <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
          Error sharing samples
        </Typography>
        <Typography variant="body1">
          There was an error initiating sample sharing.
        </Typography>
      </>
    );
  }

  return (
    <Dialog open={openShareBlocked} onClose={() => setOpenShareBlocked(false)}>
      <Alert severity={!canShare ? 'error' : 'info'} sx={{ padding: 3 }}>
        <IconButton
          aria-label="close"
          onClick={() => setOpenShareBlocked(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
        {content}
      </Alert>
    </Dialog>
  );
}
