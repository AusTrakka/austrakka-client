/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { PhessIdStatus } from './phess.id.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getDashboardFields } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import type { RootState } from '../../../app/store';
import { generateDateFilterString } from '../../../utilities/helperUtils';
// import { aggregateArrayObjects } from '../../../utilities/helperUtils';

interface PhessIdStatusState {
  loading: string
  data: PhessIdStatus | any
}

const initialState: PhessIdStatusState = {
  loading: 'idle',
  data: [],
};

export const fetchPhessIdStatus = createAsyncThunk(
  'counts/fetchPhessIdStatus',
  async (
    dispatchProps:any,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<ResponseObject | unknown> => {
    const { groupId } = dispatchProps;
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.projectDashboardState.timeFilterObject);
    const response = await getDashboardFields(groupId, 'PHESS_ID', filterString);
    if (response.status === 'Success') {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const phessIdStatusSlice = createSlice({
  name: 'phessIdStatusSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPhessIdStatus.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchPhessIdStatus.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchPhessIdStatus.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

//
export const selectPhessId = (state: AppState) => state.phessIdStatusState;
export const selectAggregatedPhessIdStatus = createSelector(
  selectPhessId,
  (phessIds) => {
    const dataArray = phessIds.data.data;
    let counts: any[] = [];
    if (dataArray !== undefined) {
      let presentCount = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        if (dataArray[i].PHESS_ID !== '' && dataArray[i].PHESS_ID !== null && dataArray[i].PHESS_ID !== undefined) {
          presentCount += 1;
        }
      }
      counts = [
        { status: 'Present', sampleCount: presentCount },
        { status: 'Missing', sampleCount: dataArray.length - presentCount },
      ];
    }
    return counts;
  },
);

export default phessIdStatusSlice.reducer;
