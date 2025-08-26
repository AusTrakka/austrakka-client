import React, { createElement, memo, useEffect, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent, Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import dayjs from 'dayjs';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTableFilterMeta } from 'primereact/datatable';
import DashboardTemplates from '../../../config/dashboardTemplates';
import { DashboardTimeFilter, DashboardTimeFilterField } from '../../../constants/dashboardTimeFilter';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import { getProjectDashboard } from '../../../utilities/resourceUtils';
import { ResponseType } from '../../../constants/responseType';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import { ProjectDashboardDetails } from '../../../types/dtos';

// NB this is a tab; project metadata is requested in ProjectOverview page;
// if we want to use this as a standalone page must dispatch request

interface ProjectDashboardProps {
  projectDesc: string,
  projectAbbrev: string | null,
}
function ProjectDashboard(props: ProjectDashboardProps) {
  const { projectDesc, projectAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const [dashboardName, setDashboardName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>(DashboardTimeFilter.ALL);
  const [timeFilterThreshold, setTimeFilterThreshold] = useState<Date | null>(null);
  // this state variable will be passed as prop for line-list filters
  const timeFilterObject: DataTableFilterMeta = React.useMemo(() => {
    if (!timeFilterThreshold) return {} as DataTableFilterMeta;
    return {
      [DashboardTimeFilterField]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            value: timeFilterThreshold,
            matchMode: FilterMatchMode.DATE_AFTER,
          },
        ],
      },
    };
  }, [timeFilterThreshold]);

  const filteredDataMemo = React.useMemo(() => {
    if (data?.loadingState !== MetadataLoadingState.DATA_LOADED) return [];
    if (!timeFilterThreshold) return data.metadata!;
    // Re-use your filtering function here or inline logic
    return data.metadata!.filter(sample =>
      dayjs(sample[DashboardTimeFilterField]!).isAfter(dayjs(timeFilterThreshold)));
  }, [data, timeFilterThreshold]);

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
      filteredData: filteredDataMemo,
      timeFilterObject,
    };

    return createElement(DashboardTemplates[dashboardName], dashboardProps);
  }, [dashboardName, projectAbbrev, filteredDataMemo, timeFilterObject]);
  
  useEffect(() => {
    async function getDashboardName() {
      const response = await getProjectDashboard(projectAbbrev!, token);
      if (response.status === ResponseType.Success) {
        const dashboard : ProjectDashboardDetails = response.data;
        setDashboardName(dashboard.name);
      } else {
        setErrorMessage('Error retrieving project dashboard');
      }
    }
    
    if (projectAbbrev &&
        tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
      getDashboardName();
    }
  }, [token, tokenLoading, projectAbbrev]);
  
  // Filter data by date
  
  const onTimeFilterChange = (event: SelectChangeEvent) => {
    let value: Date | undefined;

    if (event.target.value === DashboardTimeFilter.LAST_WEEK) {
      value = dayjs().subtract(7, 'days').toDate();
    } else if (event.target.value === DashboardTimeFilter.LAST_MONTH) {
      value = dayjs().subtract(1, 'month').toDate();
    }

    setTimeFilterThreshold(value || null);
    setTimeFilter(event.target.value as DashboardTimeFilter);
  };
  
  const renderDateSelector = () => {
    const enabled = (data?.projectFields &&
      data.projectFields.some(field => field.fieldName === DashboardTimeFilterField));
    
    return (
      <Tooltip title={enabled ? '' : `${DashboardTimeFilterField} field not found`}>
        <FormControl variant="standard" disabled={!enabled}>
          <InputLabel>Upload date filter</InputLabel>
          <Select autoWidth value={timeFilter} onChange={onTimeFilterChange}>
            <MenuItem value={DashboardTimeFilter.ALL}>
              All time
            </MenuItem>
            <MenuItem value={DashboardTimeFilter.LAST_WEEK}>
              Last week
            </MenuItem>
            <MenuItem value={DashboardTimeFilter.LAST_MONTH}>
              Last month
            </MenuItem>
          </Select>
        </FormControl>
      </Tooltip>
    );
  };
  
  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        { dashboardName && data?.loadingState === MetadataLoadingState.DATA_LOADED && (
          <>
            <Grid container size={12} justifyContent="space-between">
              <Stack direction="row" width="100%" justifyContent="space-between" alignItems="center">
                <Typography sx={{ maxWidth: '90%' }}>{projectDesc}</Typography>
                { renderDateSelector() }
              </Stack>
            </Grid>
            <Grid
              container
              size={12}
              sx={{
                marginTop: 1,
                padding: 2,
                backgroundColor: 'var(--primary-main-bg)',
              }}
            >
              {dashBoardElements}
            </Grid>
          </>
        )}
        { errorMessage && (
          <Grid size={12}>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {`An error occurred while loading your dashboard - ${errorMessage}`}
            </Alert>
          </Grid>
        )}
        { !(dashboardName && data?.loadingState === MetadataLoadingState.DATA_LOADED)
          && !errorMessage && (
          <Grid size={12}>
            Loading...
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default memo(ProjectDashboard);
