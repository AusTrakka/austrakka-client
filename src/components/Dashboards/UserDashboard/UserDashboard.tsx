/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Box, Card, CardContent, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import dayjs from 'dayjs';
import { FilterMatchMode } from 'primereact/api';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { useApi } from '../../../app/ApiContext';
import { DashboardTimeFilter, DashboardTimeFilterField } from '../../../constants/dashboardTimeFilter';
import UserOverview from '../../Widgets/UserWidgets/UserOverview/UserOverview';
import ProjectsTotal from '../../Widgets/UserWidgets/ProjectsTotal/ProjectsTotal';
import PhessIdOverall from '../../Widgets/UserWidgets/PhessIdOverall/PhessIdOverall';
import { updateTimeFilter, updateTimeFilterObject } from './userDashboardSlice';
import { fetchPhessIdOverall } from '../../Widgets/UserWidgets/PhessIdOverall/phessIdOverallSlice';
import LoadingState from '../../../constants/loadingState';
import FieldTypes from '../../../constants/fieldTypes';
import { cardStyle } from '../../../styles/dashboardStyles';

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
        field: DashboardTimeFilterField,
        fieldType: FieldTypes.DATE,
        condition: FilterMatchMode.DATE_AFTER,
        value,
      };
    }

    dispatch(updateTimeFilterObject(filterObject));

    // Dispatch widget async thunks
    if (tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchPhessIdOverall(token));
    }
  };

  return (
    <FormControl variant="standard">
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
  );
}

function UserDashboard(props: UserDashboardProps) {
  const { hidePhessWidget } = useAppSelector((state) => state.phessIdOverallState);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid container size={12} justifyContent="space-between">
          <Typography variant="h2" color="primary">Dashboard</Typography>
          <DateSelector />
        </Grid>
        <Grid container size={12} spacing={2} sx={{ marginTop: 1, padding: 2, backgroundColor: 'var(--primary-main-bg)' }}>
          <Card sx={cardStyle}>
            <CardContent>
              <UserOverview />
            </CardContent>
          </Card>
          <Card sx={cardStyle}>
            <CardContent>
              <ProjectsTotal />
            </CardContent>
          </Card>
          {
            hidePhessWidget ?
              null
              : (
                <Card sx={cardStyle}>
                  <CardContent>
                    <PhessIdOverall />
                  </CardContent>
                </Card>
              )
            }
        </Grid>
      </Grid>
    </Box>
  );
}
export default UserDashboard;
