/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ProjectsTotal } from './projects.total.interface';
import { AppState } from '../../../types/app.interface';
import { getUserDashboardProjects } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { generateDateFilterString } from '../../../utilities/helperUtils';
import type { RootState } from '../../../app/store';
import { ResponseObject } from '../../../types/responseObject.interface';

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
    token: string,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<ResponseObject | unknown> => {
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.userDashboardState.timeFilterObject);
    const response = await getUserDashboardProjects(token, filterString);
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
export const selectProjectsTotal = (state: AppState) => state.projectTotalState;

export default projectsTotalSlice.reducer;
