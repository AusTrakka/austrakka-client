import { Block, CheckCircle, Error as ErrorIcon, Send } from '@mui/icons-material';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  Typography,
} from '@mui/material';
import { type ReactNode, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import { reloadOrgMetadata } from '../../../app/orgMetadataSlice';
import { useAppDispatch } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { ResponseType } from '../../../constants/responseType';
import type { ResponseObject } from '../../../types/responseObject.interface';
import type { Sample } from '../../../types/sample.interface';
import { disableSamples } from '../../../utilities/resourceUtils';

// TODO:
// - Consolidate the dialog in the parent component that renders if no samples have been selected
// - Add a confirmation step before disabling samples

type DisableStatusProps = {
  icon: ReactNode;
  iconColor: 'error' | 'success';
  title: string;
  message: string | null;
  onClose: () => void;
};

interface OrgSampleDisableProps {
  open: boolean;
  onClose: () => void;
  selectedSamples: Sample[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  orgAbbrev: string;
}

function OrgSampleDisable(props: OrgSampleDisableProps) {
  const { open, onClose, selectedSamples, selectedIds, setSelectedIds, orgAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dispatch = useAppDispatch();

  // Handle disable samples
  const handleDisableSamples = async () => {
    if (token && tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      try {
        setStatus(LoadingState.LOADING);
        const disableResponse: ResponseObject = await disableSamples(token, selectedIds, undefined);
        if (disableResponse.status === ResponseType.Success) {
          setStatus(LoadingState.SUCCESS);
          setStatusMessage('Samples disabled successfully.');
          // Delay to allow sampleFlat to update
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 500);
          });
          dispatch(reloadOrgMetadata({ token, orgAbbrev }));
          setSelectedIds([]);
        } else {
          setStatus(LoadingState.ERROR);
          setStatusMessage(disableResponse.message || 'Error disabling samples.');
        }
      } catch (error: any) {
        setStatus(LoadingState.ERROR);
        setStatusMessage('An unexpected error occurred while disabling samples. Please try again.');
        // biome-ignore lint/suspicious/noConsole: historic
        console.error('Unexpected error disabling samples:', error);
      }
    } else {
      setStatus(LoadingState.ERROR);
      setStatusMessage('An unexpected error occurred while disabling samples. Please try again.');
    }
  };

  const renderDisableStatus = ({ icon, title, message }: DisableStatusProps) => (
    <>
      <DialogTitle>
        {icon}
        <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button variant="contained" color="success" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={status === LoadingState.LOADING ? undefined : onClose}
        disableEscapeKeyDown={status === LoadingState.LOADING}
        maxWidth={status === LoadingState.IDLE || status === LoadingState.LOADING ? 'md' : 'xs'}
        fullWidth
      >
        {status === LoadingState.ERROR &&
          renderDisableStatus({
            icon: <ErrorIcon fontSize="large" color="error" />,
            iconColor: 'error',
            title: 'Error disabling samples',
            message: statusMessage,
            onClose,
          })}
        {status === LoadingState.SUCCESS &&
          renderDisableStatus({
            icon: <CheckCircle fontSize="large" color="success" />,
            iconColor: 'success',
            title: 'Success',
            message: statusMessage,
            onClose,
          })}
        {(status === LoadingState.IDLE || status === LoadingState.LOADING) && (
          <>
            <DialogTitle>
              <Block fontSize="large" color="primary" />
              <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
                Disable Organisation Samples
              </Typography>
              <Alert severity="info">
                Disabling these sample records will remove them from the organisation line list and
                from any projects the sample(s) have been shared with. This action cannot yet be
                undone easily in the user interface.
              </Alert>
            </DialogTitle>
            <DialogContent>
              <Grid2 container spacing={4}>
                <Grid2 size={{ xs: 12, md: 5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Samples for disabling
                  </Typography>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    <b>{selectedSamples.length}</b> sample
                    {selectedSamples.length !== 1 ? 's' : ''} selected for disabling
                  </Typography>
                </Grid2>
              </Grid2>
            </DialogContent>
            <DialogActions sx={{ padding: 2 }}>
              <Button onClick={onClose} disabled={status === LoadingState.LOADING}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleDisableSamples}
                disabled={status === LoadingState.LOADING}
                startIcon={
                  !(status === LoadingState.LOADING) ? (
                    <Send />
                  ) : (
                    <CircularProgress size={16} sx={{ color: 'inherit' }} />
                  )
                }
              >
                Disable
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
export default OrgSampleDisable;
