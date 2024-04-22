import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { UserOverview } from './user.overview.interface';
import { AppState } from '../../../types/app.interface';
import { getUserDashboardOveriew } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { generateDateFilterString } from '../../../utilities/helperUtils';
import type { RootState } from '../../../app/store';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';

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
    token: any,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<ResponseObject | unknown> => {
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.userDashboardState.timeFilterObject);
    const response = await getUserDashboardOveriew(token, filterString);
    if (response.status === ResponseType.Success) {
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
