/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { StCounts } from './st.counts.interface';
import { ResponseObject } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
// eslint-disable-next-line import/no-cycle
import { AppState } from '../../../types/app.interface';
import testData from './testStData';

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
    timeFilter: string,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    console.log(timeFilter);
    console.log("fetchStCounts");
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = {
      status: 'Success',
      message: 'Request succeeded',
      data: testData,
    };
    if (response.status === 'Success') { return fulfillWithValue(response); }
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
    const initialArray = stCounts.data.data;
    const aggregatedCounts = [];
    const map = new Map();
    if (initialArray !== undefined) {
      for (let i = 0; i < initialArray.length; i += 1) {
        let found = false;
        for (const [key, value] of map) {
          if (key === initialArray[i].stValue) {
            found = true;
            const newValue = value + 1;
            map.set(initialArray[i].stValue, newValue);
            break;
          }
        }
        if (!found) { map.set(initialArray[i].stValue, 1); }
      }

      for (const [key, value] of map) {
        const obj = { stValue: '', sampleCount: 0 };
        obj.stValue = key;
        obj.sampleCount = value;
        aggregatedCounts.push(obj);
      }
    }

    return aggregatedCounts;
  },
);

export default stCountsSlice.reducer;
