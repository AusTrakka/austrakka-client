import React, { useEffect, Dispatch, SetStateAction } from 'react';
import { Box, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import Components, { ComponentActions } from '../components';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchProjectDashboard, updateTimeFilter } from './projectDashboardSlice';
import { ProjectDashboardWidget } from './project.dashboard.interface';
import LoadingState from '../../../constants/loadingState';
import { Filter } from '../../Common/QueryBuilder';

interface ProjectDashboardProps {
  projectDesc: string,
  projectId: number | null,
  setFilterList: Dispatch<SetStateAction<Filter[]>>,
  setTabValue: Dispatch<SetStateAction<number>>,
}

function DateSelector() {
  // Get initial date filter state from redux store
  // Set new date filter state from redux store
  const dispatch = useAppDispatch();
  const { timeFilter, data } = useAppSelector((state) => state.projectDashboardState);

  const onTimeFilterChange = (event: SelectChangeEvent) => {
    dispatch(updateTimeFilter(event.target.value as string));
    data.data.map(
      (widget: any) => dispatch(ComponentActions[widget.name](event.target.value as string)),
    );
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
  const { projectDesc, projectId, setFilterList, setTabValue } = props;
  const {
    data,
    loading,
    projectIdInRedux,
  } = useAppSelector((state) => state.projectDashboardState);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (projectId !== null && projectId !== projectIdInRedux) {
      dispatch(fetchProjectDashboard(projectId));
    }
  }, [dispatch, projectId, projectIdInRedux]);

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        { loading === LoadingState.SUCCESS ? (
          <>
            <Grid container item xs={12} justifyContent="space-between">
              {projectDesc}
              <DateSelector />
            </Grid>
            {data.data.map((widget: ProjectDashboardWidget) => (
            // TODO: Investigate fluid grids with multiple breakpoints
              <Grid item xs={widget.width} minWidth={300} key={widget.name}>
                <Card sx={{ padding: 1 }}>
                  <CardContent>
                    {Components(widget, setFilterList, setTabValue)}
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
