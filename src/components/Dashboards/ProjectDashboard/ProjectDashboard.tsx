import { Alert, AlertTitle, Box, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import type { DataTableFilterMeta } from 'primereact/datatable';
import React, { createElement, memo, useEffect, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import DashboardTemplates from '../../../config/dashboardTemplates';
import { DefaultDashboardTimeFilterField } from '../../../constants/dashboardTimeFilter';
import LoadingState from '../../../constants/loadingState';
import MetadataLoadingState, { hasCompleteData } from '../../../constants/metadataLoadingState';
import { ResponseType } from '../../../constants/responseType';
import type { ProjectDashboardDetails } from '../../../types/dtos';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import type { Sample } from '../../../types/sample.interface';
import { getProjectDashboard } from '../../../utilities/resourceUtils';
import DashboardFilter from '../DashboardFilter';

// NB this is a tab; project metadata is requested in ProjectOverview page;
// if we want to use this as a standalone page must dispatch request

function DashboardStatusAlert(
  errorMessage: string | null,
  dashboardName: string | null,
  loadingState: MetadataLoadingState | undefined,
): React.ReactElement | null {
  if (errorMessage) {
    return (
      <Grid size={12}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {`An error occurred while loading your dashboard - ${errorMessage}`}
        </Alert>
      </Grid>
    );
  }

  if (!dashboardName) {
    return (
      <Grid size={12}>
        <Alert severity="info">
          <AlertTitle>Loading</AlertTitle>
          Loading dashboard configuration...
        </Alert>
      </Grid>
    );
  }

  if (loadingState === MetadataLoadingState.FIELDS_LOADED) {
    return (
      <Grid size={12}>
        <Alert severity="info">
          <AlertTitle>Loading</AlertTitle>
          Dashboard found, retrieving project data...
        </Alert>
      </Grid>
    );
  }

  if (!hasCompleteData(loadingState)) {
    return (
      <Grid size={12}>
        <Alert severity="info">
          <AlertTitle>Loading</AlertTitle>
          Loading data...
        </Alert>
      </Grid>
    );
  }

  return null;
}

interface ProjectDashboardProps {
  projectDesc: string;
  projectAbbrev: string | null;
}

function ProjectDashboard(props: ProjectDashboardProps) {
  const { projectDesc, projectAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const [dashboardName, setDashboardName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const [dateField, setDateField] = useState(DefaultDashboardTimeFilterField);
  const [timeFilterObject, setTimeFilterObject] = useState<DataTableFilterMeta>({});
  const [filteredData, setFilteredData] = useState<Sample[]>([]);

  const dashBoardElements = React.useMemo(() => {
    if (!dashboardName || !projectAbbrev) {
      return createElement(() => null);
    }
    if (typeof DashboardTemplates[dashboardName] === 'undefined') {
      setErrorMessage(`Dashboard type ${dashboardName} is not known`);
      return createElement(() => null);
    }

    const dashboardProps: ProjectDashboardTemplateProps = {
      projectAbbrev,
      filteredData: filteredData,
      timeFilterObject: timeFilterObject,
      dateFilterField: dateField,
    };

    return createElement(DashboardTemplates[dashboardName], dashboardProps);
  }, [dashboardName, projectAbbrev, filteredData, timeFilterObject, dateField]);

  useEffect(() => {
    async function getDashboardName() {
      const response = await getProjectDashboard(projectAbbrev!, token);
      if (response.status === ResponseType.Success) {
        const dashboard: ProjectDashboardDetails = response.data;
        setDashboardName(dashboard.name);
      } else {
        setErrorMessage('Error retrieving project dashboard');
      }
    }

    if (
      projectAbbrev &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      getDashboardName();
    }
  }, [token, tokenLoading, projectAbbrev]);

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        {dashboardName && hasCompleteData(data?.loadingState) && (
          <>
            <Grid container size={12} justifyContent="space-between">
              <Stack
                direction="row"
                width="100%"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography sx={{ maxWidth: '90%' }}>{projectDesc}</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <DashboardFilter
                    data={data}
                    dateField={dateField}
                    setDateField={setDateField}
                    setTimeFilterObject={setTimeFilterObject}
                    setFilteredData={setFilteredData}
                  />
                </Stack>
              </Stack>
            </Grid>
            <Grid
              container
              size={12}
              sx={{
                marginTop: 1,
                padding: 2,
                backgroundColor: Theme.PrimaryMainBackground,
              }}
            >
              {dashBoardElements}
            </Grid>
          </>
        )}
        {DashboardStatusAlert(errorMessage, dashboardName, data?.loadingState)}
      </Grid>
    </Box>
  );
}

export default memo(ProjectDashboard);
