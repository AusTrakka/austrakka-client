import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertTitle, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, Stack, Typography } from '@mui/material';
import { Group, GroupRole, Organisation } from '../../../types/dtos';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { selectUserState, UserSliceState } from '../../../app/userSlice';
import { fetchGroupMetadata, GroupMetadataState, selectGroupMetadata } from '../../../app/groupMetadataSlice';
import { useApi } from '../../../app/ApiContext';
import { getGroup, getGroupList, getOrganisation, patchSampleShare } from '../../../utilities/resourceUtils';
import { ResponseObject } from '../../../types/responseObject.interface';
import LoadingState from '../../../constants/loadingState';
import { ResponseType } from '../../../constants/responseType';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import OrganisationSampleShareTable from './OrganisationSampleShareTable';
import SampleShareDialog from './SampleShareDialog';
import { hasPermission, PermissionLevel } from '../../../permissions/accessTable'; // New separate dialog component

function OrganisationSampleShareOverview() {
  const { orgAbbrev } = useParams();

  const [organisationGroup, setOrganisationGroup] = useState<Group>();
  const [orgShareError, setorgShareError] = useState<boolean>(false);
  const [orgShareErrorMessage, setOrgShareErrorMessage] = useState<string | null>(null);
  const [selectableProjects, setSelectableProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [noTargetError, setNoTargetError] = useState<boolean>(false);
  const [canShare, setCanShare] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();
  const user: UserSliceState = useAppSelector(selectUserState);
  const metadata = useAppSelector(state => {
    console.log(organisationGroup);
    if (!organisationGroup) return null;
    return selectGroupMetadata(state, organisationGroup.groupId);
  });
  console.log(metadata, 'this is the state metadata');

  useEffect(() => {
    if (organisationGroup &&
        tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
      dispatch(fetchGroupMetadata({ groupId: organisationGroup.groupId, token }));
    }
  }, [token, tokenLoading, dispatch, organisationGroup]);

  useEffect(() => {
    const checkSharingPermissions = (ownerGroupName: string) => hasPermission(
      user,
      ownerGroupName,
      'organisation/sample/share',
      PermissionLevel.CanShow,
    );
    const ownerOrgGroupName: string | undefined = user.groupRoles
      .find((groupRole: GroupRole) => groupRole.group.name === `${orgAbbrev}-Owner`)?.group.name;
    if (user.loading === LoadingState.SUCCESS &&
        (ownerOrgGroupName || user.admin)
    ) {
      setCanShare(checkSharingPermissions(ownerOrgGroupName ?? ''));
    }
  }, [orgAbbrev, user]);

  useEffect(() => {
    if (user && user.groupRolesByGroup) {
      const projectsThatCanBeSelected = Object.entries(user.groupRolesByGroup)
        .filter(([_, roles]) =>
          roles.some(role => role.toLowerCase() === 'uploader'))
        .map(([key]) => key)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

      if (projectsThatCanBeSelected.length === 0) {
        setNoTargetError(true);
        return;
      }

      setNoTargetError(false);
      setSelectableProjects(projectsThatCanBeSelected);
    }
  }, [user]);

  useEffect(() => {
    async function getOwnerOrgGroupAsync() {
      if (orgAbbrev) {
        const orgResp:ResponseObject<Group> = await getGroup(`${orgAbbrev}-Owner`, token);

        if (orgResp.status === ResponseType.Success) {
          setOrganisationGroup(orgResp.data);
          setorgShareError(false);
          setOrgShareErrorMessage(null);
        } else {
          setorgShareError(true);
          setOrgShareErrorMessage(orgResp.message);
        }
      }
    }

    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getOwnerOrgGroupAsync();
    }
  }, [orgAbbrev, token, tokenLoading]);

  // Opens dialog with staged changes
  const handleShareClick = () => {
    if (!selectedProject || selectedSamples.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select a project and at least one sample to share.',
        severity: 'warning',
      });
      return;
    }

    setDialogOpen(true);
  };

  // Closes dialog and resets state
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Closes snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handles actual sharing after confirmation
  const handleSharingSamples = async () => {
    try {
      const shareResponse: ResponseObject = await patchSampleShare(
        selectedProject!,
        selectedSamples,
        token,
      );

      if (shareResponse.status !== ResponseType.Success) {
        throw new Error(shareResponse.message || 'Failed to share samples');
      }

      setDialogOpen(false);
      setSelectedSamples([]);
      setSelectedProject(null);
      setSnackbar({
        open: true,
        message: shareResponse.message || 'Samples shared successfully!',
        severity: 'success',
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Error sharing samples:', error);
      setSnackbar({
        open: true,
        message: 'Failed to share samples. Please try again.',
        severity: 'error',
      });
    }
  };

  const renderControls = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        mt: 1,
      }}
    >
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="project-select-label">Project Group</InputLabel>
        <Select
          labelId="project-select-label"
          id="project-select"
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(e.target.value as string)}
          label="Project Group"
        >
          {selectableProjects.map((project) => (
            <MenuItem key={project} value={project}>
              {project}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        onClick={handleShareClick}
        disabled={!selectedProject || selectedSamples.length === 0}
      >
        Share
      </Button>
    </Box>
  );

  const renderWarning = () => {
    if (!canShare) {
      return (
        <Alert severity="warning">
          <AlertTitle>Warning</AlertTitle>
          You do not have permission to share samples.
        </Alert>
      );
    }
    if (metadata?.loadingState === MetadataLoadingState.ERROR ||
        metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      return (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          An error occured loading metadata; metadata may be missing or incomplete.
        </Alert>
      );
    }
    return null;
  };

  return (
    <>
      <Stack direction="column" spacing={2} display="flex">
        <Box>
          <Typography variant="h2" color="primary">
            {`Share ${orgAbbrev} Organisation Samples`}
          </Typography>
          <Typography />
        </Box>
        {renderWarning()}
        {canShare && renderControls()}
        {organisationGroup && canShare ?
          (
            <OrganisationSampleShareTable
              selectedIds={selectedSamples}
              setSelectedIds={setSelectedSamples}
              displayFields={metadata?.fields || []}
              uniqueValues={metadata?.fieldUniqueValues ?? null}
              tableMetadata={metadata?.metadata ?? []}
              metadataLoadingState={metadata?.loadingState || MetadataLoadingState.IDLE}
              fieldLoadingState={metadata?.columnLoadingStates || {}}
              emptyColumns={metadata?.emptyColumns || []}
            />
          ) : null}
      </Stack>
      <SampleShareDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        selectedProject={selectedProject}
        selectedSamples={selectedSamples}
        onConfirm={handleSharingSamples}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default OrganisationSampleShareOverview;
