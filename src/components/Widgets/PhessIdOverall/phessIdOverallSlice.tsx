/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { PhessIdOverall } from './phess.id.overall.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getUserDashboardPhessStatus } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { generateDateFilterString } from '../../../utilities/helperUtils';
import type { RootState } from '../../../app/store';

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
    _: void,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<ResponseObject | unknown> => {
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.userDashboardState.timeFilterObject);
    const response = await getUserDashboardPhessStatus(filterString);
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
