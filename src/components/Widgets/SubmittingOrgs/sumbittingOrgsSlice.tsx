/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { SubmittingOrgs } from './submitting.orgs.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getDashboardFields } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { aggregateArrayObjects } from '../../../utilities/helperUtils';

interface SubmittingOrgsState {
  loading: string
  data: SubmittingOrgs | any
}

const initialState: SubmittingOrgsState = {
  loading: 'idle',
  data: [],
};

export const fetchSubmittingOrgs = createAsyncThunk(
  'counts/fetchSubmittingOrgs',
  async (
    dispatchProps:any,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    const { groupId } = dispatchProps;
    const response = await getDashboardFields(groupId, 'Owner_group');
    if (response.status === 'Success') {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const submittingOrgsSlice = createSlice({
  name: 'submittingOrgsSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchSubmittingOrgs.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchSubmittingOrgs.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchSubmittingOrgs.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload.message;
    });
  },
});

//
export const selectSubmittingOrgs = (state: AppState) => state.submittingOrgsState;
export const selectAggregatedOrgs = createSelector(
  selectSubmittingOrgs,
  (submittingOrgs) => {
    const counts = aggregateArrayObjects('Owner_group', submittingOrgs.data.data);
    return counts;
  },
);

export default submittingOrgsSlice.reducer;
