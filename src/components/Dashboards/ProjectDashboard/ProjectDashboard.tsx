import React, { useEffect, Dispatch, SetStateAction } from 'react';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import dayjs from 'dayjs';
import DashboardTemplateActions from '../../../config/dashboardActions';
import DashboardTemplates from '../../../config/dashboardTemplates';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchProjectDashboard, updateTimeFilter, updateTimeFilterObject } from './projectDashboardSlice';
import LoadingState from '../../../constants/loadingState';
import { Filter } from '../../Common/QueryBuilder';

interface ProjectDashboardProps {
  projectDesc: string,
  projectId: number | null,
  groupId: number | null,
  setFilterList: Dispatch<SetStateAction<Filter[]>>,
  setTabValue: Dispatch<SetStateAction<number>>,
}

function renderDashboard(
  dashboardName: any,
  projectId: any,
  groupId: any,
  setFilterList: any,
  setTabValue: Dispatch<React.SetStateAction<number>>,
) {
  if (typeof DashboardTemplates[dashboardName] !== 'undefined') {
    return React.createElement(
      DashboardTemplates[dashboardName],
      { projectId, groupId, setFilterList, setTabValue },
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

  const onTimeFilterChange = (event: SelectChangeEvent) => {
    dispatch(updateTimeFilter(event.target.value as string));

    if (event.target.value === DashboardTimeFilter.LAST_WEEK) {
      dispatch(updateTimeFilterObject(
        {
          field: 'Uploaded',
          fieldType: 'date',
          condition: '>',
          value: dayjs().subtract(7, 'days'),
        },
      ));
    } else if (event.target.value === DashboardTimeFilter.LAST_MONTH) {
      dispatch(updateTimeFilterObject(
        {
          field: 'Uploaded',
          fieldType: 'date',
          condition: '>',
          value: dayjs().subtract(1, 'month'),
        },
      ));
    } else {
      dispatch(updateTimeFilterObject({}));
    }
    // TODO: Create timeFilterString to pass to widget asyncthunks
    // Maybe time filter (event value) can be converted into date filter string here
    // Then we don't pass the event value, we pass the formatted strign to the asyncthunk

    const disptachProps = {
      projectId,
      groupId,
      timeFilter: event.target.value as string,
    };
    DashboardTemplateActions[data.data].map(
      (dispatchEvent: any) => dispatch(dispatchEvent(disptachProps)),
    );
    // data.data.map(
    //   (widget: any) => dispatch(ComponentActions[widget.name](event.target.value as string)),
    // );
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
  const { projectDesc, projectId, groupId, setFilterList, setTabValue } = props;
  const {
    data,
    loading,
    projectIdInRedux,
  } = useAppSelector((state) => state.projectDashboardState);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (projectId !== null && projectId !== projectIdInRedux) {
      const thunkObj = { projectId, groupId };
      dispatch(fetchProjectDashboard(thunkObj));
    }
  }, [dispatch, projectId, groupId, projectIdInRedux]);

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        { loading === LoadingState.SUCCESS ? (
          <>
            <Grid container item xs={12} justifyContent="space-between">
              {projectDesc}
              { data.data.length !== 0 ? (
                <DateSelector projectId={projectId} groupId={groupId} />
              ) : null }
            </Grid>
            <Grid container item xs={12} sx={{ marginTop: 1, paddingRight: 2, paddingBottom: 2, backgroundColor: 'rgb(238, 242, 246)' }}>
              {renderDashboard(data.data, projectId, groupId, setFilterList, setTabValue)}
            </Grid>

            {/* {data.data.map((widget: ProjectDashboardWidget) => (
              <Grid item xs={widget.width} minWidth={300} key={widget.name}>
                <Card sx={{ padding: 1 }}>
                  <CardContent>
                    {Components(widget, setFilterList, setTabValue)}
                  </CardContent>
                </Card>
              </Grid>
            ))} */}
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
