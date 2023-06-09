import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import Components from '../components';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchProjectDashboard, updateTimeFilter } from './projectDashboardSlice';
import { ProjectDashboardComponent } from './project.dashboard.interface';
import LoadingState from '../../../constants/loadingState';

interface ProjectDashboardProps {
  projectDesc: string,
  projectId: any // TODO: Fix
}

function DateSelector() {
  // Get initial date filter state from redux store
  // Set new date filter state from redux store
  const projectDashboardDispatch = useAppDispatch();
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);

  const onTimeFilterChange = (event: SelectChangeEvent) => {
    projectDashboardDispatch(updateTimeFilter(event.target.value as string));
  };

  return (
    <FormControl variant="standard">
      <InputLabel>Date filter</InputLabel>
      <Select autoWidth value={timeFilter} onChange={onTimeFilterChange}>
        <MenuItem value={DashboardTimeFilter.ALL}>All time</MenuItem>
        <MenuItem value={DashboardTimeFilter.LAST_WEEK}>Last week</MenuItem>
        <MenuItem value={DashboardTimeFilter.LAST_MONTH}>Last month</MenuItem>
        <MenuItem value={DashboardTimeFilter.LAST_SEQUENCING}>Since last sequencing run</MenuItem>
      </Select>
    </FormControl>
  );
}

function ProjectDashboard(props: ProjectDashboardProps) {
  const { projectDesc, projectId } = props;
  const dateFilter = useState<DashboardTimeFilter>(DashboardTimeFilter.ALL);
  const { data, loading } = useAppSelector((state) => state.projectDashboardState);
  const projectDashboardDispatch = useAppDispatch();

  useEffect(() => {
    console.log('Rendering project dashboard');
    console.log(projectId);
    if (loading === 'idle' && projectId !== null) {
      projectDashboardDispatch(fetchProjectDashboard(projectId));
    }
  }, [loading, projectDashboardDispatch, projectId]);

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        { loading === LoadingState.SUCCESS ? (
          <>
            <Grid container item xs={12} justifyContent="space-between">
              {projectDesc}
              <DateSelector />
            </Grid>
            {data.data.map((component: ProjectDashboardComponent) => (
            // TODO: Investigate fluid grids with multiple breakpoints
              <Grid item xs={component.width} minWidth={300} key={component.name}>
                <Card sx={{ padding: 1 }}>
                  <CardContent>
                    {Components(component, dateFilter)}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </>
        )
          : (
            'Loading...'
          )}
      </Grid>
    </Box>
  );
}
export default ProjectDashboard;
