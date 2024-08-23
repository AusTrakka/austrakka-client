import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { FilterMatchMode } from 'primereact/api';
import DashboardTemplateActions from '../../../config/dashboardActions';
import DashboardTemplates from '../../../config/dashboardTemplates';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchProjectDashboard, updateTimeFilter, updateTimeFilterObject } from './projectDashboardSlice';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';
import FieldTypes from '../../../constants/fieldTypes';

interface ProjectDashboardProps {
  projectDesc: string,
  projectId: number | null,
  groupId: number | null,
}

function renderDashboard(
  dashboardName: any,
  projectId: any,
  groupId: any,
) {
  if (typeof DashboardTemplates[dashboardName] !== 'undefined') {
    return React.createElement(
      DashboardTemplates[dashboardName],
      { projectId, groupId },
    );
  }
  // Returns nothing if a matching React dashboard template component doesn't exist
  return React.createElement(
    () => (
      null
    ),
  );
}

function DateSelector(props: any) {
  const { projectId, groupId } = props;
  // Get initial date filter state from redux store
  // Set new date filter state from redux store
  const dispatch = useAppDispatch();
  const { timeFilter, data } = useAppSelector((state) => state.projectDashboardState);
  const { token } = useApi();

  const onTimeFilterChange = (event: SelectChangeEvent) => {
    dispatch(updateTimeFilter(event.target.value as string));
    let filterObject = {};
    let value;

    if (event.target.value === DashboardTimeFilter.LAST_WEEK) {
      value = dayjs().subtract(7, 'days').toDate();
    } else if (event.target.value === DashboardTimeFilter.LAST_MONTH) {
      value = dayjs().subtract(1, 'month').toDate();
    }

    if (value !== undefined) {
      filterObject = {
        field: 'Date_created',
        fieldType: FieldTypes.DATE,
        condition: FilterMatchMode.DATE_AFTER,
        value,
      };
    }

    dispatch(updateTimeFilterObject(filterObject));

    const dispatchProps = {
      projectId,
      groupId,
      token,
      timeFilter: event.target.value as string,
    };
    DashboardTemplateActions[data.data].map(
      (dispatchEvent: any) => dispatch(dispatchEvent(dispatchProps)),
    );
  };

  return (
    <FormControl variant="standard">
      <InputLabel>Date filter</InputLabel>
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
  );
}

function ProjectDashboard(props: ProjectDashboardProps) {
  const { projectDesc, projectId, groupId } = props;
  const { token, tokenLoading } = useApi();
  const {
    data,
    loading,
    projectIdInRedux,
  } = useAppSelector((state) => state.projectDashboardState);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (projectId !== null &&
        projectId !== projectIdInRedux &&
        tokenLoading !== LoadingState.IDLE &&
        tokenLoading !== LoadingState.LOADING) {
      const thunkObj = { projectId, groupId, token };
      dispatch(fetchProjectDashboard(thunkObj));
    }
  }, [dispatch, projectId, groupId, projectIdInRedux, token, tokenLoading]);

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        { loading === LoadingState.SUCCESS && (
          <>
            <Grid container item xs={12} justifyContent="space-between">
              <Typography>{projectDesc}</Typography>
              { data.data.length !== 0 ? (
                <DateSelector projectId={projectId} groupId={groupId} />
              ) : null }
            </Grid>
            <Grid container item xs={12} sx={{ marginTop: 1, paddingRight: 2, paddingBottom: 2, backgroundColor: 'rgb(238, 242, 246)' }}>
              {renderDashboard(data.data, projectId, groupId)}
            </Grid>
          </>
        )}
        { loading === LoadingState.ERROR && (
          <Grid item xs={12}>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {`An error occurred while loading your dashboard - ${data.message}`}
            </Alert>
          </Grid>
        )}
        { loading === LoadingState.LOADING && (
          <Grid item xs={12}>
            Loading...
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
export default ProjectDashboard;
