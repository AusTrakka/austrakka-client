import React, { ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, Grid2, InputLabel, MenuItem, Select, Skeleton, Typography,
} from '@mui/material';
import { CheckCircle, Error, IosShare, Send } from '@mui/icons-material';
import { Sample } from '../../../types/sample.interface';
import { selectUserState, UserSliceState } from '../../../app/userSlice';
import { useAppSelector } from '../../../app/store';
import { getDisplayFields, getGroup, getProjectFields, shareSamples } from '../../../utilities/resourceUtils';
import { useApi } from '../../../app/ApiContext';
import { ResponseType } from '../../../constants/responseType';
import { ResponseObject } from '../../../types/responseObject.interface';
import LoadingState from '../../../constants/loadingState';
import { getSharableProjects, getShareableOrgGroups } from '../../../utilities/uploadUtils';

type DestinationType = 'project' | 'orgGroup';
type ShareStatusProps = {
  icon: ReactNode;
  iconColor: 'error' | 'success';
  title: string;
  message: string | null;
  onClose: () => void;
};

const destinationTypes = [
  { label: 'Project', value: 'project' },
  { label: 'Organisation group', value: 'orgGroup' },
];

interface OrgSampleShareProps {
  open: boolean;
  onClose: () => void;
  selectedSamples: Sample[];
  selectedIds: string[];
  orgAbbrev: string;
}

function OrgSampleShare(props: OrgSampleShareProps) {
  const { open, onClose, selectedSamples, selectedIds, orgAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const user: UserSliceState = useAppSelector(selectUserState);
  const [destType, setDestType] = useState<DestinationType>('project');
  const [destination, setDestination] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectableProjects, setSelectableProjects] = useState<string[]>([]);
  const [selectableOrgGroups, setSelectableOrgGroups] = useState<string[]>([]);
  const [canViewDestinationFields, setCanViewDestinationFields] = useState<boolean>(true);
  const [previewFields, setPreviewFields] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<boolean>(false);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Update options when destination type changes
  useEffect(() => {
    const opts = destType === 'project' ? selectableProjects : selectableOrgGroups;
    setOptions(opts);
    setDestination('');
    setPreviewFields([]);
    setCanViewDestinationFields(false);
  }, [destType, selectableProjects, selectableOrgGroups]);

  // Get selectable projects/org groups from user permission details
  useEffect(() => {
    if (user && user.groupRoles) {
      const projectsThatCanBeSelected = getSharableProjects(user.groupRoles);
      const orgGroupsThatCanBeSelected = getShareableOrgGroups(orgAbbrev, user.groupRoles);

      setSelectableProjects(projectsThatCanBeSelected);
      setSelectableOrgGroups(orgGroupsThatCanBeSelected);
    }
  }, [user, orgAbbrev]);

  const handleDestinationChange = async (selectedDestination: string) => {
    if (selectedDestination) {
      setDestination(selectedDestination);

      const canViewPreview = Object.entries(user.groupRolesByGroup)
        .some(([groupName, roles]) =>
          groupName === (selectedDestination) && roles.includes('Viewer'));
      
      setCanViewDestinationFields(canViewPreview);
      if (canViewPreview &&
        tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
        if (destType === 'project') {
          // If destination is a project, get project fields
          const destAbbrev = selectedDestination.replace(/-Group$/, '');
          const fieldsResp = await getProjectFields(destAbbrev, token);
          if (fieldsResp.status === ResponseType.Success) {
            setPreviewFields(fieldsResp.data);
            setPreviewError(false);
            setPreviewLoading(false);
          } else {
            setPreviewError(true);
            setPreviewLoading(false);
          }
        } else if (destType === 'orgGroup') {
          // If destination is an org group, get fields by group context
          const groupResp = await getGroup(selectedDestination, token);
          if (groupResp.status === ResponseType.Success && groupResp.data) {
            const groupId:number = groupResp.data?.groupId;
            const fieldsResp = await getDisplayFields(groupId, token);
            if (fieldsResp.status === ResponseType.Success) {
              setPreviewFields(fieldsResp.data);
              setPreviewError(false);
              setPreviewLoading(false);
            } else {
              setPreviewError(true);
              setPreviewLoading(false);
            }
          } else {
            setPreviewError(true);
            setPreviewLoading(false);
          }
        }
      } else {
        setPreviewError(true);
      }
    }
  };

  // Handle sharing samples
  const handleSharingSamples = async () => {
    try {
      setStatus(LoadingState.LOADING);
      const shareResponse: ResponseObject = await shareSamples(
        destination!,
        selectedIds,
        token,
      );
      if (shareResponse.status === ResponseType.Success) {
        setStatus(LoadingState.SUCCESS);
        // TODO: Improve how success message is shown from shareResponse.messages array
        setStatusMessage('Samples shared successfully.');
      } else {
        setStatus(LoadingState.ERROR);
        setStatusMessage(shareResponse.message || 'Error sharing samples.');
      }
    } catch (error: any) {
      setStatus(LoadingState.ERROR);
      setStatusMessage('An unexpected error occurred while sharing samples. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Unexpected error sharing samples:', error);
    }
  };

  const renderShareStatus = ({ icon, title, message }: ShareStatusProps) => (
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
          renderShareStatus({
            icon: <Error fontSize="large" color="error" />,
            iconColor: 'error',
            title: 'Error sharing samples',
            message: statusMessage,
            onClose,
          })}
        {status === LoadingState.SUCCESS &&
          renderShareStatus({
            icon: <CheckCircle fontSize="large" color="success" />,
            iconColor: 'success',
            title: 'Success',
            message: statusMessage,
            onClose,
          })}
        {(status === LoadingState.IDLE || status === LoadingState.LOADING) && (
          <>
            <DialogTitle>
              <IosShare fontSize="large" color="primary" />
              <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
                Share Organisation Samples
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: 1 }}>
                Please note you can only share samples to projects or
                organisation groups in which you have Uploader permissions in.
              </Typography>
              <Alert severity="warning">
                Sharing these sample records will register the sample as being a
                <b> part of the target project. </b>
                This will share any associated
                <b> sequence files </b>
                with project analysts, and will share
                <b> existing metadata values </b>
                with project members if those metadata variables appear
                in the target project.
              </Alert>
            </DialogTitle>
            <DialogContent>
              <Grid2 container spacing={4}>
                <Grid2 size={{ xs: 12, md: 5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Samples for sharing
                  </Typography>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    <b>{selectedSamples.length}</b>
                    {' '}
                    sample
                    {selectedSamples.length !== 1 ? 's' : ''}
                    {' '}
                    selected for sharing
                  </Typography>
                  <FormControl
                    variant="standard"
                    sx={{ minWidth: 220, maxWidth: 400, minHeight: 20, marginBottom: 2 }}
                    error={false}
                  >
                    <InputLabel>Select destination type</InputLabel>
                    <Select
                      value={destType}
                      onChange={(e) => setDestType(e.target.value as DestinationType)}
                      label="Select destination type"
                      disabled={status === LoadingState.LOADING}
                    >
                      {destinationTypes.map((opt) => (
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
                      {destinationTypes.find(dt => dt.value === destType)?.label.toLowerCase()}
                      *
                    </InputLabel>
                    <Select
                      value={destination}
                      // onChange={(e) => setDestination(e.target.value)}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      label={`Select ${destinationTypes.find(dt => dt.value === destType)?.label.toLowerCase() ?? ''}*`}
                      notched
                      disabled={status === LoadingState.LOADING}
                    >
                      {options.length > 0 ? (
                        options.map((opt) => (
                          // For projects, append "-Group" to match group naming convention
                          // Prevents added complexity when checking perms for data preview/sharing
                          <MenuItem key={opt} value={destType === 'project' ? `${opt}-Group` : opt}>
                            {opt}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No available options</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 7 }}>
                  {canViewDestinationFields ? (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        Shared data preview
                      </Typography>
                      <Typography variant="subtitle2">
                        These are the fields that may be shared with the selected
                        {` ${destinationTypes.find(dt => dt.value === destType)?.label.toLowerCase() ?? ''} `}
                        if they are populated in the sample records.
                      </Typography>
                      {previewLoading ? (
                        <Box sx={{ marginTop: 1 }}>
                          <Skeleton
                            variant="rectangular"
                            width={60 + Math.floor(Math.random() * 50)}
                            height={32}
                            sx={{ margin: 0.2, borderRadius: 8, display: 'inline-block' }}
                          />
                          <Skeleton
                            variant="rectangular"
                            width={60 + Math.floor(Math.random() * 50)}
                            height={32}
                            sx={{ margin: 0.2, borderRadius: 8, display: 'inline-block' }}
                          />
                          <Skeleton
                            variant="rectangular"
                            width={60 + Math.floor(Math.random() * 50)}
                            height={32}
                            sx={{ margin: 0.2, borderRadius: 8, display: 'inline-block' }}
                          />
                        </Box>
                      ) : null}
                      { previewError ? (
                        <Typography variant="body2" color="error" sx={{ marginTop: 2 }}>
                          Error loading preview fields.
                        </Typography>
                      ) : (
                        <Box sx={{ marginTop: 1, maxHeight: 200, overflowY: 'auto' }}>
                          {previewFields.map((field) => (
                            <Chip
                              variant="outlined"
                              key={destType === 'project' ? field.fieldName : field.columnName}
                              sx={{ margin: 0.3 }}
                              label={destType === 'project' ? field.fieldName : field.columnName}
                            />
                          ))}
                        </Box>
                      )}
                    </>
                  ) : null}
                </Grid2>
              </Grid2>
            </DialogContent>
            <DialogActions sx={{ padding: 2 }}>
              <Button onClick={onClose} disabled={status === LoadingState.LOADING}>Cancel</Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSharingSamples}
                disabled={!destination || (status === LoadingState.LOADING)}
                startIcon={!(status === LoadingState.LOADING) ? <Send /> : <CircularProgress size={16} sx={{ color: 'inherit' }} />}
              >
                Share
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
export default OrgSampleShare;
