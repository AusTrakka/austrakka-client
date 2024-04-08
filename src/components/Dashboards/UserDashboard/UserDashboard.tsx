/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Box, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { FilterMatchMode } from 'primereact/api';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { useApi } from '../../../app/ApiContext';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import UserOverview from '../../Widgets/UserOverview/UserOverview';
import ProjectsTotal from '../../Widgets/ProjectsTotal/ProjectsTotal';
import PhessIdOverall from '../../Widgets/PhessIdOverall/PhessIdOverall';
import { updateTimeFilter, updateTimeFilterObject } from './userDashboardSlice';
import { fetchUserOverview } from '../../Widgets/UserOverview/userOverviewSlice';
import { fetchProjectsTotal } from '../../Widgets/ProjectsTotal/projectsTotalSlice';
import { fetchPhessIdOverall } from '../../Widgets/PhessIdOverall/phessIdOverallSlice';
import LoadingState from '../../../constants/loadingState';
import FieldTypes from '../../../constants/fieldTypes';

interface UserDashboardProps {
}

function DateSelector(props: any) {
  const dispatch = useAppDispatch();
  const { timeFilter } = useAppSelector((state) => state.userDashboardState);
  const { token, tokenLoading } = useApi();

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

    // Dispatch widget async thunks
    if (tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchUserOverview(token));
      dispatch(fetchProjectsTotal(token));
      dispatch(fetchPhessIdOverall(token));
    }
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

function UserDashboard(props: UserDashboardProps) {
  const dispatch = useAppDispatch();
  const { hidePhessWidget } = useAppSelector((state) => state.phessIdOverallState);

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        <Grid container item xs={12} justifyContent="space-between">
          <Typography variant="h2" color="primary">Dashboard</Typography>
          <DateSelector />
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: 1, paddingRight: 2, paddingBottom: 2, backgroundColor: 'rgb(238, 242, 246)' }}>
          <Grid container spacing={2}>
            <Grid container item xs={12}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <UserOverview />
                </CardContent>
              </Card>
            </Grid>
            <Grid container item xs={12} spacing={2}>
              <Grid item>
                <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                  <CardContent>
                    <ProjectsTotal />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item>
                {
                  hidePhessWidget ?
                    null
                    : (
                      <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                        <CardContent>
                          <PhessIdOverall />
                        </CardContent>
                      </Card>
                    )
                  }
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
export default UserDashboard;
