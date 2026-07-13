import { ArrowBack } from '@mui/icons-material';
import {
  Alert,
  type AlertColor,
  Box,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import { useAppSelector } from '../../app/store';
import { selectUserState } from '../../app/userSlice';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Organisation, ProjectDashboardDetails } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { isoDateOrNotRecorded } from '../../utilities/dateUtils';
import { getAvailableProjectDashboards, getOrganisations } from '../../utilities/resourceUtils';
import BasicPropertiesSection from './BasicPropertiesSection';
import { useProjectDetails } from './useProjectDetails';

function ProjectSettingsOverview() {
  const { projectAbbrev } = useParams();
  const navigate = useNavigate();
  const { token, tokenLoading } = useApi();
  const { projectDetails, status, errorMessage, refetchProject } = useProjectDetails(
    projectAbbrev,
    token,
    tokenLoading,
  );
  const [dashboards, setDashboards] = useState<string[]>([]);
  const [dashboardErrorMessage, setDashboardErrorMessage] = useState<string | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [organisationErrorMessage, setOrganisationErrorMessage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'success' });
  const { superUser, admin } = useAppSelector(selectUserState);

  const isAdmin = admin || superUser;

  const handleBasicPropertiesSaved = (severity: AlertColor, message: string) => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

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

  useEffect(() => {
    async function fetchAvailableOrganisations() {
      const response: ResponseObject<Organisation[]> = await getOrganisations(false, token);
      if (response.status !== ResponseType.Success) {
        setOrganisationErrorMessage(response.message);
        return;
      }
      const organsiations = response.data ?? [];
      setOrganisations(organsiations);
    }

    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING && isAdmin) {
      fetchAvailableOrganisations();
    }
  }, [token, tokenLoading, isAdmin]);

  const navigateToSummary = () => {
    if (!projectAbbrev) return;
    navigate(`/projects/${projectAbbrev}/summary`);
  };

  if (status === LoadingState.ERROR || dashboardErrorMessage || organisationErrorMessage) {
    return (
      <div>
        <Alert severity="error">
          {errorMessage ?? dashboardErrorMessage ?? organisationErrorMessage}
        </Alert>
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
        gap={3}
        sx={{ mb: 2 }}
      >
        <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flexGrow: 1 }}>
          <IconButton aria-label="back" onClick={() => navigateToSummary()} sx={{ flexShrink: 0 }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography
            className="pageTitle"
            noWrap
            sx={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              display: 'block',
              paddingBottom: '0px !important',
            }}
          >
            {projectDetails?.name}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            padding: '6px 12px',
            flexShrink: 0,
          }}
        >
          <Stack direction="column" spacing={0.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.725rem', color: 'text.secondary', fontWeight: 500 }}
              >
                Created:
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.725rem', color: Theme.PrimaryGrey700 }}
              >
                {projectDetails?.created
                  ? isoDateOrNotRecorded(new Date(projectDetails.created).toISOString())
                  : 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.725rem', color: 'text.secondary' }}>
                by
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  color: Theme.PrimaryGrey700,
                  maxWidth: '80px', // Tightened slightly more for the vertical stack layout
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={projectDetails?.createdBy}
              >
                {projectDetails?.createdBy || 'N/A'}
              </Typography>
            </Box>

            {/* Row 2: Update Info */}
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.725rem', color: 'text.secondary', fontWeight: 500 }}
              >
                Updated:
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.725rem', color: Theme.PrimaryGrey700 }}
              >
                {projectDetails?.lastUpdated
                  ? isoDateOrNotRecorded(new Date(projectDetails.lastUpdated).toISOString())
                  : 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.725rem', color: 'text.secondary' }}>
                by
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  color: Theme.PrimaryGrey700,
                  maxWidth: '80px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={projectDetails?.lastUpdatedBy}
              >
                {projectDetails?.lastUpdatedBy || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
      <BasicPropertiesSection
        projectAbbrev={projectAbbrev}
        canonical={projectDetails}
        onSaved={refetchProject}
        onSaveResult={handleBasicPropertiesSaved}
        organisations={organisations}
        dashboards={dashboards}
        editable={isAdmin}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default ProjectSettingsOverview;
