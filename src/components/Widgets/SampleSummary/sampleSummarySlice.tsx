/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { SampleSummary } from './sample.summary.interface';
import { AppState } from '../../../types/app.interface';
import { getProjectDashboardOveriew } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import type { RootState } from '../../../app/store';
import { generateDateFilterString } from '../../../utilities/helperUtils';
import { ResponseObject } from '../../../types/responseObject.interface';

interface SampleSummaryState {
  loading: LoadingState
  data: SampleSummary | any
}

const initialState: SampleSummaryState = {
  loading: LoadingState.IDLE,
  data: [],
};

export const fetchSummary = createAsyncThunk(
  'summary/fetchSummary',
  async (
    dispatchProps: any,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<ResponseObject | unknown> => {
    const { groupId, token } = dispatchProps;
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.projectDashboardState.timeFilterObject);
    const response = await getProjectDashboardOveriew(groupId, token, filterString);
    if (response.status === 'Success') {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const summarySlice = createSlice({
  name: 'sampleSummaryState',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchSummary.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchSummary.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchSummary.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

//
export const selectSummary = (state: AppState) => state.sampleSummaryState;

// export const { updateCount } = summarySlice.actions;

export default summarySlice.reducer;
