import { Block, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  Typography,
} from '@mui/material';
import { type ReactNode, useMemo, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import { reloadOrgMetadata } from '../../../app/orgMetadataSlice';
import { useAppDispatch } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { ResponseType } from '../../../constants/responseType';
import type { ResponseObject } from '../../../types/responseObject.interface';
import type { Sample } from '../../../types/sample.interface';
import { disableSamples } from '../../../utilities/resourceUtils';

const parseSharedGroups = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dispatch = useAppDispatch();

  // Collect deduped list of projects these samples have been shared with (if shared_groups is available)
  const sharedProjects = useMemo(
    () => Array.from(new Set(selectedSamples.flatMap((s) => parseSharedGroups(s.Shared_groups)))),
    [selectedSamples],
  );

  // Handle disable samples
  const handleDisableSamples = async () => {
    if (token && tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      try {
        setStatus(LoadingState.LOADING);
        const disableResponse: ResponseObject = await disableSamples(token, selectedIds);
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
        maxWidth={
          (status === LoadingState.IDLE && !confirmOpen) || status === LoadingState.LOADING
            ? 'md'
            : 'xs'
        }
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
            {!confirmOpen && (
              <>
                <DialogTitle>
                  <Block fontSize="large" color="primary" />
                  <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
                    Disable Organisation Samples
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 2 }}>
                    Disabling these sample records will remove them from the organisation line list
                    and from any projects the sample records have been shared with.{' '}
                    <b>This action cannot easily be undone in the user interface.</b>
                  </Typography>
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
                    {sharedProjects.length > 0 && (
                      <Grid2 size={{ xs: 12, md: 7 }}>
                        <Typography variant="caption" color="text.secondary">
                          Projects that may be affected
                        </Typography>
                        {/* Render list of shared projects - only show the first 5 if there are many and indicate if there are more */}
                        <Typography variant="body1">
                          {sharedProjects.slice(0, 5).map((project) => (
                            <Chip
                              key={project}
                              label={project}
                              sx={{ marginRight: 1, marginBottom: 1 }}
                            />
                          ))}
                          {sharedProjects.length > 5 && (
                            <Chip
                              label={`+ ${sharedProjects.length - 5} more`}
                              sx={{ marginRight: 1, marginBottom: 1 }}
                            />
                          )}
                        </Typography>
                      </Grid2>
                    )}
                  </Grid2>
                </DialogContent>
              </>
            )}
            {confirmOpen && (
              <>
                <DialogTitle>
                  <Block fontSize="large" color="primary" />
                  <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
                    Are you sure?
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 2 }}>
                    Are you sure you want to disable the <b>{selectedSamples.length}</b> selected
                    sample{selectedSamples.length !== 1 ? 's' : ''}? This action cannot easily be
                    undone in the user interface.
                  </Typography>
                </DialogTitle>
              </>
            )}
            <DialogActions sx={{ padding: 2 }}>
              <Button onClick={onClose} disabled={status === LoadingState.LOADING}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  if (!confirmOpen) setConfirmOpen(true);
                  else handleDisableSamples();
                }}
                startIcon={
                  !(status === LoadingState.LOADING) ? (
                    <></>
                  ) : (
                    <CircularProgress size={16} sx={{ color: 'inherit' }} />
                  )
                }
                disabled={status === LoadingState.LOADING}
              >
                {confirmOpen ? 'Yes, disable samples' : 'Disable'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
export default OrgSampleDisable;
