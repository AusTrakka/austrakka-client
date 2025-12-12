import React, { ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, Grid2, InputLabel, MenuItem, Select, Typography,
} from '@mui/material';
import { CheckCircle, Error, IosShare, RemoveCircleOutline, Send } from '@mui/icons-material';
import { Sample } from '../../../types/sample.interface';
import { selectUserState, UserSliceState } from '../../../app/userSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { unshareSamples } from '../../../utilities/resourceUtils';
import { useApi } from '../../../app/ApiContext';
import { ResponseType } from '../../../constants/responseType';
import { ResponseObject } from '../../../types/responseObject.interface';
import LoadingState from '../../../constants/loadingState';
import { getSharableProjects, getShareableOrgGroups } from '../../../utilities/uploadUtils';
import { reloadGroupMetadata } from '../../../app/groupMetadataSlice';

type SourceType = 'project' | 'orgGroup';
const sourceTypes = [
  { label: 'Project', value: 'project' },
  { label: 'Organisation group', value: 'orgGroup' },
];

type ShareStatusProps = {
  icon: ReactNode;
  iconColor: 'error' | 'success';
  title: string;
  message: string | null;
  onClose: () => void;
};

interface OrgSampleUnshareProps {
  open: boolean;
  onClose: () => void;
  selectedSamples: Sample[];
  selectedIds: string[];
  orgAbbrev: string;
  groupContext: number;
}

function OrgSampleUnshare(props: OrgSampleUnshareProps) {
  const { open, onClose, selectedSamples, selectedIds, orgAbbrev, groupContext } = props;
  const { token } = useApi();
  const user: UserSliceState = useAppSelector(selectUserState);
  const [source, setSource] = useState<string>('');
  const [sourceType, setSourceType] = useState<SourceType>('project');
  const [canValidate, setCanValidate] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectableProjects, setSelectableProjects] = useState<string[]>([]);
  const [selectableOrgGroups, setSelectableOrgGroups] = useState<string[]>([]);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dispatch = useAppDispatch();

  // Update options when source type changes
  useEffect(() => {
    const opts = sourceType === 'project' ? selectableProjects : selectableOrgGroups;
    setOptions(opts);
    setSource('');
  }, [sourceType, selectableProjects, selectableOrgGroups]);

  // Get selectable projects/org groups from user permission details
  useEffect(() => {
    if (user && user.groupRoles) {
      const projectsThatCanBeSelected = getSharableProjects(user.groupRoles);
      const orgGroupsThatCanBeSelected = getShareableOrgGroups(orgAbbrev, user.groupRoles);

      // Check if selected samples have Shared_groups configured
      const allHaveSharedGroups = selectedSamples.every(s =>
        s.Shared_groups !== null && s.Shared_groups !== undefined);

      if (!allHaveSharedGroups) {
        // Cannot validate if samples don't have Shared_groups column
        setCanValidate(false);
        setValidationMessage('Cannot validate selection as shared groups are not configured in this view.');
        setSelectableProjects(projectsThatCanBeSelected);
        setSelectableOrgGroups(orgGroupsThatCanBeSelected);
        return;
      }
      setCanValidate(true);
      const groupSet = new Set<string>();
      selectedSamples.forEach(sample => {
        try {
          JSON.parse(sample.Shared_groups).forEach((group: string) => groupSet.add(group));
        } catch { /* empty */ }
      });
      const unique = Array.from(groupSet);
      const cleanUnique = unique.map(v => v.replace(/-Group$/, '')); // Clean for projects

      // Intersection of shareable and shared (unique)
      const intersectProjects = projectsThatCanBeSelected.filter(opt => cleanUnique.includes(opt));
      const intersectOrgGroups = orgGroupsThatCanBeSelected.filter(opt => unique.includes(opt));
      
      setSelectableProjects(intersectProjects);
      setSelectableOrgGroups(intersectOrgGroups);
    }
  }, [user, orgAbbrev, selectedSamples]);

  useEffect(() => {
    // Check how many of selected samples exist in selected source
    if (canValidate && source) {
      const count = selectedSamples.reduce((acc, sample) => {
        const groups: string[] = JSON.parse(sample.Shared_groups);
        return acc + (groups.includes(source) ? 1 : 0);
      }, 0);
      if (count < selectedSamples.length) {
        setValidationMessage(
          `${count} out of ${selectedSamples.length} selected sample${selectedSamples.length - count > 1 ? 's' : ''} ` +
          `are currently shared with "${source.replace(/-Group$/, '')}". ` +
          `No changes will be made to the other ${selectedSamples.length - count} sample${selectedSamples.length - count > 1 ? 's' : ''}.`,
        );
      } else {
        setValidationMessage(
          `${count} out of ${selectedSamples.length} selected sample${selectedSamples.length - count > 1 ? 's' : ''} are currently shared with "${source.replace(/-Group$/, '')}".`,
        );
      }
    }
  }, [selectedSamples, source, canValidate]);

  const handleSourceChange = async (selectedSource: string) => {
    if (selectedSource) {
      setSource(selectedSource);
    }
  };

  // Handle unsharing samples
  const handleUnsharingSamples = async () => {
    try {
      setStatus(LoadingState.LOADING);
      const unshareResponse: ResponseObject = await unshareSamples(
        token,
        source!,
        selectedIds,
      );
      if (unshareResponse.status === ResponseType.Success) {
        setStatus(LoadingState.SUCCESS);
        setStatusMessage('Samples unshared successfully.');
        // Delay to allow sampleFlat to update; required while sample sharing comes via sampleFlat
        await new Promise<void>((resolve) => { setTimeout(resolve, 500); });
        dispatch(reloadGroupMetadata({ groupId: groupContext!, token }));
      } else {
        setStatus(LoadingState.ERROR);
        setStatusMessage(unshareResponse.message || 'Error unsharing samples.');
      }
    } catch (error: any) {
      setStatus(LoadingState.ERROR);
      setStatusMessage('An unexpected error occurred while unsharing samples. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Unexpected error unsharing samples:', error);
    }
  };

  const renderUnshareStatus = ({ icon, title, message }: ShareStatusProps) => (
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
        maxWidth={(status === LoadingState.IDLE || status === LoadingState.LOADING) ? 'md' : 'xs'}
        fullWidth
      >
        {status === LoadingState.ERROR &&
          renderUnshareStatus({
            icon: <Error fontSize="large" color="error" />,
            iconColor: 'error',
            title: 'Error unsharing samples',
            message: statusMessage,
            onClose,
          })}
        {status === LoadingState.SUCCESS &&
          renderUnshareStatus({
            icon: <CheckCircle fontSize="large" color="success" />,
            iconColor: 'success',
            title: 'Success',
            message: statusMessage,
            onClose,
          })}
        {(status === LoadingState.IDLE || status === LoadingState.LOADING) && (
          <>
            <DialogTitle>
              <Box sx={{ position: 'relative', width: 40, height: 40, mb: 1 }}>
                <IosShare fontSize="large" />
                <RemoveCircleOutline
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    right: -3,
                    transform: 'scale(0.8)',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                  }}
                />
              </Box>
              <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
                Unshare Organisation Samples
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: 1 }}>
                Please note you can only unshare samples from projects or
                organisation groups in which you have Uploader permissions in.
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid2 container spacing={4}>
                <Grid2 size={{ xs: 12, md: 5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Samples for unsharing
                  </Typography>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    <b>{selectedSamples.length}</b>
                    {' '}
                    sample
                    {selectedSamples.length !== 1 ? 's' : ''}
                    {' '}
                    selected for unsharing
                  </Typography>
                  <FormControl
                    variant="standard"
                    sx={{ minWidth: 220, maxWidth: 400, minHeight: 20, marginBottom: 2 }}
                    error={false}
                  >
                    <InputLabel>Select source type</InputLabel>
                    <Select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as SourceType)}
                      label="Select source type"
                      disabled={status === LoadingState.LOADING}
                    >
                      {sourceTypes.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <br />
                  <FormControl
                    variant="standard"
                    sx={{ minWidth: 220, maxWidth: 400, minHeight: 20, marginBottom: 2 }}
                    error={false}
                  >
                    <InputLabel shrink>
                      Select
                      {' '}
                      {sourceTypes.find(st => st.value === sourceType)?.label.toLowerCase()}
                      *
                    </InputLabel>
                    <Select
                      value={source}
                      onChange={(e) => handleSourceChange(e.target.value)}
                      label={`Select ${sourceTypes.find(st => st.value === sourceType)?.label.toLowerCase() ?? ''}*`}
                      notched
                      disabled={status === LoadingState.LOADING}
                    >
                      {options.length > 0 ? (
                        options.map((opt) => (
                          // For projects, append "-Group" to match group naming convention
                          // Prevents added complexity when checking perms for validation/unsharing
                          <MenuItem key={opt} value={sourceType === 'project' ? `${opt}-Group` : opt}>
                            {opt}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No available options</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid2>
                {source && (
                  <Grid2 size={{ xs: 12, md: 7 }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Alert severity="info">
                      {validationMessage}
                    </Alert>
                  </Grid2>
                )}
              </Grid2>
            </DialogContent>
            <DialogActions sx={{ padding: 2 }}>
              <Button onClick={onClose} disabled={status === LoadingState.LOADING}>Cancel</Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleUnsharingSamples}
                disabled={!source || (status === LoadingState.LOADING)}
                startIcon={!(status === LoadingState.LOADING) ? <Send /> : <CircularProgress size={16} sx={{ color: 'inherit' }} />}
              >
                Unshare
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
export default OrgSampleUnshare;
