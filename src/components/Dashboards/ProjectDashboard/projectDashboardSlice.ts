/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ResponseObject, getProjectDashboard } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { ProjectDashboardComponent } from './project.dashboard.interface';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import { AppState } from '../../../types/app.interface';

interface ProjectDashboardState {
  loading: LoadingState
  timeFilter: string
  data: ProjectDashboardComponent | any
}

const initialState: ProjectDashboardState = {
  loading: LoadingState.IDLE,
  timeFilter: DashboardTimeFilter.ALL,
  data: [],
};

export const fetchProjectDashboard = createAsyncThunk(
  'dashboard/fetchProjectDashboard',
  async (
    projectId: number,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    const response = await getProjectDashboard(projectId);
    console.log(response);
    if (response.status === 'Success') { return fulfillWithValue(response); }
    return rejectWithValue(response);
  },
);

const projectDashboardSlice = createSlice({
  name: 'projectDashboardSlice',
  initialState,
  reducers: {
    updateTimeFilter: (state, action) => {
      state.timeFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProjectDashboard.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchProjectDashboard.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchProjectDashboard.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload.message;
    });
  },
});

export const selectProjectDashboard = (state: AppState) => state.projectDashboardState;

export const { updateTimeFilter } = projectDashboardSlice.actions;

export default projectDashboardSlice.reducer;
