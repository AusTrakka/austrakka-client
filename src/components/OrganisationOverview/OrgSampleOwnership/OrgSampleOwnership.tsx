import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { type ReactNode, useEffect, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import { reloadGroupMetadata } from '../../../app/groupMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { selectUserState, type UserSliceState } from '../../../app/userSlice';
import LoadingState from '../../../constants/loadingState';
import RecordTypes from '../../../constants/record-type.enum';
import { ResponseType } from '../../../constants/responseType';
import { ScopeDefinitions } from '../../../constants/scopes';
import { getRecordNamesWithScope } from '../../../permissions/accessTable';
import type { ResponseObject } from '../../../types/responseObject.interface';
import type { Sample } from '../../../types/sample.interface';
import { changeSampleCustodian } from '../../../utilities/resourceUtils';

interface OrgSampleOwnershipProps {
  open: boolean;
  onClose: () => void;
  selectedSamples: Sample[];
  selectedIds: string[];
  orgName: string;
  orgAbbrev: string;
  groupContext: number;
}

type SubmitStatusProps = {
  icon: ReactNode;
  iconColor: 'error' | 'success';
  title: string;
  message: string | null;
  onClose: () => void;
};

function OrgSampleOwnership(props: OrgSampleOwnershipProps) {
  const { open, onClose, selectedSamples, selectedIds, orgAbbrev, orgName, groupContext } = props;
  const { token, tokenLoading } = useApi();
  const user: UserSliceState = useAppSelector(selectUserState);
  const [selectableOrgGroups, setSelectableOrgGroups] = useState<string[]>([]);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [newCustodian, setNewCustodian] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (user?.scopes) {
      const orgGroupsThatCanBeSelected = getRecordNamesWithScope(
        user,
        RecordTypes.ORGANISATION,
        ScopeDefinitions.LinkSamplesToOrg,
        orgAbbrev,
      );
      setSelectableOrgGroups(orgGroupsThatCanBeSelected);
    }
  }, [orgAbbrev, user]);

  const handleSubmit = async () => {
    setStatus(LoadingState.LOADING);
    if (
      newCustodian &&
      token &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      try {
        const response: ResponseObject = await changeSampleCustodian(
          token,
          selectedIds,
          orgAbbrev,
          newCustodian,
        );
        if (response.status === ResponseType.Success) {
          setStatusMessage(
            'Samples custodian changed successfully. These samples will no longer appear under the current organisations samples.',
          );
          setStatus(LoadingState.SUCCESS);
          // Refresh to get updated sample list (delayed to allow sampleFlat update)
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 500);
          });
          dispatch(reloadGroupMetadata({ groupId: groupContext!, token, orgAbbrev }));
        } else {
          setStatusMessage(
            response.message || 'Failed to change samples custodian. Please try again.',
          );
          setStatus(LoadingState.ERROR);
        }
      } catch {
        setStatus(LoadingState.ERROR);
        setStatusMessage(
          'An unexpected error occurred while changing samples custodian. Please try again.',
        );
      }
    } else {
      setStatus(LoadingState.ERROR);
      setStatusMessage(
        'An unexpected error occurred while changing samples custodian. Please try again.',
      );
    }
  };

  const renderSubmitStatus = ({ icon, title, message }: SubmitStatusProps) => (
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
        maxWidth="xs"
        fullWidth
      >
        {status === LoadingState.ERROR &&
          renderSubmitStatus({
            icon: <ErrorIcon fontSize="large" color="error" />,
            iconColor: 'error',
            title: 'Error sharing samples',
            message: statusMessage,
            onClose,
          })}
        {status === LoadingState.SUCCESS &&
          renderSubmitStatus({
            icon: <CheckCircle fontSize="large" color="success" />,
            iconColor: 'success',
            title: 'Success',
            message: statusMessage,
            onClose,
          })}
        {(status === LoadingState.IDLE || status === LoadingState.LOADING) && (
          <>
            <DialogTitle>
              <SwapHorizIcon fontSize="large" color="primary" />
              <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
                Change Sample Custodian
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: 1 }}>
                Are you sure you want to change the custodian for the selected samples?
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Typography variant="caption" color="text.secondary">
                Selected samples
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                <b>{selectedSamples.length}</b> sample
                {selectedSamples.length !== 1 ? 's' : ''} selected
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current custodian organisation
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                <b>{orgName}</b> ({orgAbbrev})
              </Typography>
              <FormControl
                variant="standard"
                sx={{ minWidth: 220, maxWidth: 400, minHeight: 20, marginBottom: 2 }}
                error={false}
              >
                <InputLabel shrink>Select new custodian organisation</InputLabel>
                <Select
                  value={newCustodian}
                  onChange={(e) => setNewCustodian(e.target.value)}
                  label="Select new custodian"
                  disabled={status === LoadingState.LOADING}
                >
                  {selectableOrgGroups.length > 0 ? (
                    selectableOrgGroups.map((org) => (
                      <MenuItem key={org} value={org}>
                        {org}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No available options</MenuItem>
                  )}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ padding: 2 }}>
              <Button onClick={onClose} disabled={status === LoadingState.LOADING}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={!newCustodian || status === LoadingState.LOADING}
                startIcon={
                  !(status === LoadingState.LOADING) ? (
                    <CheckCircle />
                  ) : (
                    <CircularProgress size={16} sx={{ color: 'inherit' }} />
                  )
                }
              >
                Change Custodian
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}

export default OrgSampleOwnership;
