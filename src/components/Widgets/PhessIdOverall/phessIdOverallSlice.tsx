/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { PhessIdOverall } from './phess.id.overall.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getUserDashboardProjects } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';

interface PhessIdOverallState {
  loading: string
  data: PhessIdOverall | any
}

const initialState: PhessIdOverallState = {
  loading: 'idle',
  data: [],
};

export const fetchPhessIdOverall = createAsyncThunk(
  'counts/fetchPhessIdOverall',
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

const phessIdOverallSlice = createSlice({
  name: 'phessIdOverallSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPhessIdOverall.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchPhessIdOverall.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchPhessIdOverall.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

//
export const selectPhessIdOverall = (state: AppState) => state.phessIdOverallState;

export default phessIdOverallSlice.reducer;
