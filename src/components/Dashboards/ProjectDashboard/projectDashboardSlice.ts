/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ResponseObject, getProjectDashboard } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { ProjectDashboardWidget } from './project.dashboard.interface';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import { AppState } from '../../../types/app.interface';
import { ComponentActions } from '../components';

interface ProjectDashboardState {
  loading: LoadingState
  timeFilter: string
  timeFilterObject: any // TODO: Fix
  projectIdInRedux: any
  data: ProjectDashboardWidget | any
}

const initialState: ProjectDashboardState = {
  loading: LoadingState.IDLE,
  // This initial state might need to reflect state of user dashboard time filter
  timeFilter: DashboardTimeFilter.ALL,
  timeFilterObject: {},
  projectIdInRedux: 0,
  data: [],
};

export const fetchProjectDashboard = createAsyncThunk(
  'dashboard/fetchProjectDashboard',
  async (
    projectId: number,
    { rejectWithValue, fulfillWithValue, dispatch },
  ):Promise<ResponseObject | unknown> => {
    const response = await getProjectDashboard(projectId);
    const payload = { projectId, response };
    if (response.status === 'Success') {
      // TODO: Order array based on "order" properties
      response.data?.map(
        (widget: any) => dispatch(ComponentActions[widget.name](response.data.timeFilter)),
      );
      return fulfillWithValue(payload);
    }
    return rejectWithValue(payload);
  },
);

const projectDashboardSlice = createSlice({
  name: 'projectDashboardSlice',
  initialState,
  reducers: {
    updateTimeFilter: (state, action) => {
      state.timeFilter = action.payload;
    },
    updateTimeFilterObject: (state, action) => {
      state.timeFilterObject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProjectDashboard.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchProjectDashboard.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload.response;
      state.projectIdInRedux = action.payload.projectId;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchProjectDashboard.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload.message;
    });
  },
});

export const selectProjectDashboard = (state: AppState) => state.projectDashboardState;

export const { updateTimeFilter, updateTimeFilterObject } = projectDashboardSlice.actions;

export default projectDashboardSlice.reducer;
