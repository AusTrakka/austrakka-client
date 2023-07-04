/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { UserOverview } from './user.overview.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject, getUserDashboardOveriew } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';

interface UserOverviewState {
  loading: string
  data: UserOverview | any
}

const initialState: UserOverviewState = {
  loading: 'idle',
  data: [],
};

export const fetchUserOverview = createAsyncThunk(
  'counts/fetchUserOverview',
  async (
    props: any,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    const response = await getUserDashboardOveriew();
    if (response.status === 'Success') {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const userOverviewSlice = createSlice({
  name: 'userOverviewSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUserOverview.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchUserOverview.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchUserOverview.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

//
export const selectUserOverview = (state: AppState) => state.userOverviewState;

export default userOverviewSlice.reducer;
