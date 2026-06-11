import { Close } from '@mui/icons-material';
import { Alert, Dialog, IconButton, Typography } from '@mui/material';

interface ChangeOwnershipBlockedProps {
  canChangeOwnership: boolean;
  openChangeOwnershipBlocked: boolean;
  setOpenChangeOwnershipBlocked: (open: boolean) => void;
  selectedIdsLength: number;
}

export function ChangeOwnershipBlocked(props: ChangeOwnershipBlockedProps) {
  const {
    canChangeOwnership,
    openChangeOwnershipBlocked,
    selectedIdsLength,
    setOpenChangeOwnershipBlocked,
  } = props;

  let content;
  if (!canChangeOwnership) {
    content = (
      <>
        <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
          Incorrect permissions
        </Typography>
        <Typography variant="body1">
          Only users with <strong>ChangeSamplesOwner</strong> scope in the organisation can change
          sample custodian.
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
          Please select at least one sample in the table to change custodian.
        </Typography>
      </>
    );
  } else {
    content = (
      <>
        <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
          Error changing sample custodian
        </Typography>
        <Typography variant="body1">
          There was an error initiating sample custodian change.
        </Typography>
      </>
    );
  }

  return (
    <Dialog open={openChangeOwnershipBlocked} onClose={() => setOpenChangeOwnershipBlocked(false)}>
      <Alert severity={!canChangeOwnership ? 'error' : 'info'} sx={{ padding: 3 }}>
        <IconButton
          aria-label="close"
          onClick={() => setOpenChangeOwnershipBlocked(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
        {content}
      </Alert>
    </Dialog>
  );
}
