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
    </div>
  );
}

export default ProjectSettingsOverview;
