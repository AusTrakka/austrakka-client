/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, Dispatch, SetStateAction } from 'react';
import { Alert, AlertTitle, Box, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import UserOverview from '../../Widgets/UserOverview/UserOverview';
import ProjectsTotal from '../../Widgets/ProjectsTotal/ProjectsTotal';
import PhessIdOverall from '../../Widgets/PhessIdOverall/PhessIdOverall';

interface UserDashboardProps {
}

function DateSelector(props: any) {
  const dispatch = useAppDispatch();

  const onTimeFilterChange = (event: SelectChangeEvent) => {
    // Update time filter object and call dispatches
  };

  return (
    <FormControl variant="standard">
      <InputLabel>Date filter</InputLabel>
      <Select autoWidth value={DashboardTimeFilter.ALL} onChange={onTimeFilterChange} disabled>
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

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        <Grid container item xs={12} justifyContent="space-between">
          <Typography variant="h2" color="primary">Dashboard</Typography>
          <DateSelector />
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: 1, paddingRight: 2, paddingBottom: 2, backgroundColor: 'rgb(238, 242, 246)' }}>
          <Grid container spacing={2}>
            <Grid item lg={8} md={12}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <UserOverview />
                </CardContent>
              </Card>
            </Grid>
            <Grid item lg={4} md={6} xs={8}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <ProjectsTotal />
                </CardContent>
              </Card>
            </Grid>
            <Grid item lg={4} md={6} xs={8}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  {/* TODO: Only render this widget if data from widget endpoint !== empty array */}
                  <PhessIdOverall />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
export default UserDashboard;
