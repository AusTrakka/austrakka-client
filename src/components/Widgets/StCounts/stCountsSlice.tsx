/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { StCounts } from './st.counts.interface';
import { ResponseObject, getDashboardFields } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
// eslint-disable-next-line import/no-cycle
import { AppState } from '../../../types/app.interface';
import { aggregateArrayObjects } from '../../../utilities/helperUtils';

interface StCountsState {
  loading: string
  data: StCounts | any
}

const initialState: StCountsState = {
  loading: 'idle',
  data: [],
};

export const fetchStCounts = createAsyncThunk(
  'stCountsSlice/fetchStCounts',
  async (
    dispatchProps: any,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    const { groupId } = dispatchProps;
    const response = await getDashboardFields(groupId, 'ST');
    if (response.status === 'Success') {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const stCountsSlice = createSlice({
  name: 'stCountsSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchStCounts.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchStCounts.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchStCounts.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload.message;
    });
  },
});

export const selectStCounts = (state: AppState) => state.stCountsState;

// selectAggregatedStCounts: Aggregates sample counts based on ST
export const selectAggregatedStCounts = createSelector(
  selectStCounts,
  (stCounts) => {
    const counts = aggregateArrayObjects('ST', stCounts.data.data);
    return counts;
  },
);

export default stCountsSlice.reducer;
