/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getThresholdAlerts } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';
import type { RootState } from '../../../app/store';

interface ThresholdAlertsState {
  loading: string
  data: any
}

const initialState: ThresholdAlertsState = {
  loading: 'idle',
  data: [],
};

export const fetchThresholdAlerts = createAsyncThunk(
  'thresholdAlertsSlice/fetchThresholdAlerts',
  async (
    dispatchProps: any,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    const { groupId, token } = dispatchProps;
    const response = await getThresholdAlerts(groupId, 'Serotype', token);
    if (response.status === ResponseType.Success) {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const thresholdAlertsSlice = createSlice({
  name: 'thresholdAlertsSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchThresholdAlerts.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchThresholdAlerts.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchThresholdAlerts.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

export const selectThresholdAlerts = (state: RootState) => state.thresholdAlertsState;

export default thresholdAlertsSlice.reducer;
