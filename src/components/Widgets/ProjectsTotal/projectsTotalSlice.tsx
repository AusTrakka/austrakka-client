/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ProjectsTotal } from './projects.total.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getUserDashboardProjects } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';

interface ProjectsTotalState {
  loading: string
  data: ProjectsTotal | any
}

const initialState: ProjectsTotalState = {
  loading: 'idle',
  data: [],
};

export const fetchProjectsTotal = createAsyncThunk(
  'counts/fetchProjectsTotal',
  async (
    props: any,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    const response = await getUserDashboardProjects();
    if (response.status === 'Success') {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const projectsTotalSlice = createSlice({
  name: 'projectsTotalSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchProjectsTotal.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchProjectsTotal.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchProjectsTotal.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

//
export const selectProjectsTotal = (state: AppState) => state.userOverviewState;

export default projectsTotalSlice.reducer;
