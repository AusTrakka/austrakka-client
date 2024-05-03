import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { PhessIdStatus } from './phess.id.interface';
import { getDashboardFields } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import type { RootState } from '../../../app/store';
import { generateDateFilterString } from '../../../utilities/helperUtils';
import { ResponseObject } from '../../../types/responseObject.interface';
// import { aggregateArrayObjects } from '../../../utilities/helperUtils';
import { ResponseType } from '../../../constants/responseType';

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
    const { groupId, token } = dispatchProps;
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.projectDashboardState.timeFilterObject);
    const response = await getDashboardFields(groupId, token, ['PHESS_ID'], filterString);
    if (response.status === ResponseType.Success) {
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
export const selectPhessId = (state: RootState) => state.phessIdStatusState;
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
