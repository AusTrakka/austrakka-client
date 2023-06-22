/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { SampleSummary } from './sample.summary.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getProjectDashboardOveriew } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';

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
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    const { projectId, groupId } = dispatchProps;
    const response = await getProjectDashboardOveriew(groupId, '');
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
      state.data = action.payload.message;
    });
  },
});

//
export const selectSummary = (state: AppState) => state.sampleSummaryState;

// export const { updateCount } = summarySlice.actions;

export default summarySlice.reducer;
