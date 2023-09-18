/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { QcStatus } from './qc.status.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getDashboardFields } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { aggregateArrayObjects, generateDateFilterString } from '../../../utilities/helperUtils';
import type { RootState } from '../../../app/store';

interface QcStatusState {
  loading: string
  data: QcStatus | any
}

const initialState: QcStatusState = {
  loading: 'idle',
  data: [],
};

export const fetchQcStatus = createAsyncThunk(
  'counts/fetchQcStatus',
  async (
    dispatchProps:any,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<ResponseObject | unknown> => {
    const { groupId } = dispatchProps;
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.projectDashboardState.timeFilterObject);
    const response = await getDashboardFields(groupId, ['Qc_status'], filterString);
    if (response.status === 'Success') {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const qcStatusSlice = createSlice({
  name: 'qcStatusSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchQcStatus.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchQcStatus.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchQcStatus.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

//
export const selectQcStatus = (state: AppState) => state.qcStatusState;
export const selectAggregatedQcStatus = createSelector(
  selectQcStatus,
  (qcStatus) => {
    const counts = aggregateArrayObjects('Qc_status', qcStatus.data.data);
    return counts;
  },
);

export default qcStatusSlice.reducer;
