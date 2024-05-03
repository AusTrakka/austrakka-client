import { createSlice } from '@reduxjs/toolkit';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import LoadingState from '../../../constants/loadingState';

interface UserDashboardState {
  loading: LoadingState
  timeFilter: string
  timeFilterObject: any
  data: any
}

const initialState: UserDashboardState = {
  loading: LoadingState.IDLE,
  timeFilter: DashboardTimeFilter.ALL,
  timeFilterObject: {},
  data: [],
};

const userDashboardSlice = createSlice({
  name: 'userDashboardSlice',
  initialState,
  reducers: {
    updateTimeFilter: (state, action) => {
      state.timeFilter = action.payload;
    },
    updateTimeFilterObject: (state, action) => {
      state.timeFilterObject = action.payload;
    },
  },
});

export const { updateTimeFilter, updateTimeFilterObject } = userDashboardSlice.actions;

export default userDashboardSlice.reducer;
