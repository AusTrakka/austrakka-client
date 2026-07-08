import { ArrowBack } from '@mui/icons-material';
import { Alert, Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import { useStableNavigate } from '../../app/NavigationContext';
import { useAppSelector } from '../../app/store';
import { selectUserState } from '../../app/userSlice';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { ProjectDashboardDetails } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { isoDateOrNotRecorded } from '../../utilities/dateUtils';
import { getAvailableProjectDashboards } from '../../utilities/resourceUtils';
import BasicPropertiesSection from './BasicPropertiesSection';
import { useProjectDetails } from './useProjectDetails';

function ProjectSettingsOverview() {
  const { projectAbbrev } = useParams();
  const { navigate } = useStableNavigate();
  const { token, tokenLoading } = useApi();
  const { projectDetails, status, errorMessage, refetchProject } = useProjectDetails(
    projectAbbrev,
    token,
    tokenLoading,
  );
  const [dashboards, setDashboards] = useState<string[]>([]);
  const [dashboardErrorMessage, setDashboardErrorMessage] = useState<string | null>(null);
  const { superUser, admin } = useAppSelector(selectUserState);

  const isAdmin = admin || superUser;

  useEffect(() => {
    async function fetchAvailableDashboards() {
      const response: ResponseObject<ProjectDashboardDetails[]> =
        await getAvailableProjectDashboards(token);
      if (response.status !== ResponseType.Success) {
        setDashboardErrorMessage(response.message);
        return;
      }
      const dashboards = response.data ?? [];
      setDashboards(dashboards.map((dashboard) => dashboard.name));
    }

    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING && isAdmin) {
      fetchAvailableDashboards();
    }
  }, [token, tokenLoading, isAdmin]);

  const navigateToSummary = () => {
    if (!projectAbbrev) return;
    navigate(`/projects/${projectAbbrev}/summary`);
  };

  if (status === LoadingState.ERROR || dashboardErrorMessage) {
    return (
      <div>
        <Alert severity="error">{errorMessage ?? dashboardErrorMessage}</Alert>
      </div>
    );
  }

  if (!projectDetails) {
    return null;
  }

  return (
    <div>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        maxWidth="900px"
        sx={{ mb: 2 }} // Adds a bit of breathing room below the header
      >
        {/* Left: Back Button and Project Name */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            className="pageTitle"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              paddingBottom: 0,
            }}
          >
            <IconButton aria-label="back" onClick={() => navigateToSummary()}>
              <ArrowBack fontSize="small" />
            </IconButton>
            {projectDetails!.name}
          </Typography>
        </Box>

        {/* Right: Project Metadata (Created & Updated info) */}
        <Paper elevation={0} variant="outlined" sx={{ padding: '10px' }}>
          <Stack direction="row" spacing={3}>
            {/* Left Column: Creation Info */}
            <Stack direction="column" spacing={0.2} minWidth={200}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                  Created:
                </Typography>
                <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                  {isoDateOrNotRecorded(new Date(projectDetails.created).toISOString())}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                  Created By:
                </Typography>
                <Typography
                  variant="caption"
                  fontSize=".8rem"
                  color={Theme.PrimaryGrey700}
                  sx={{ fontWeight: 500 }}
                >
                  {projectDetails.createdBy || 'N/A'}
                </Typography>
              </Stack>
            </Stack>

            {/* Right Column: Update Info */}
            <Stack direction="column" spacing={0.2} minWidth={200}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                  Last Updated:
                </Typography>
                <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                  {isoDateOrNotRecorded(new Date(projectDetails.lastUpdated).toISOString())}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                  Updated By:
                </Typography>
                <Typography
                  variant="caption"
                  fontSize=".8rem"
                  color={Theme.PrimaryGrey700}
                  sx={{ fontWeight: 500 }}
                >
                  {projectDetails.lastUpdatedBy || 'N/A'}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <BasicPropertiesSection
        projectAbbrev={projectAbbrev}
        canonical={projectDetails}
        onSaved={refetchProject}
        dashboards={dashboards}
        editable={isAdmin}
      />
    </div>
  );
}

export default ProjectSettingsOverview;
