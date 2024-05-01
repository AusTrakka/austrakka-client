/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { Organisations } from './organisations.interface';
import { getDashboardFields } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';
import { aggregateArrayObjects, generateDateFilterString } from '../../../utilities/helperUtils';
import type { RootState } from '../../../app/store';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';

interface OrganisationsState {
  loading: string
  data: Organisations | any
}

const initialState: OrganisationsState = {
  loading: 'idle',
  data: [],
};

export const fetchOrganisations = createAsyncThunk(
  'counts/fetchOrganisations',
  async (
    dispatchProps:any,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<ResponseObject | unknown> => {
    const { groupId, token } = dispatchProps;
    const state = getState() as RootState;
    const filterString = generateDateFilterString(state.projectDashboardState.timeFilterObject);
    const response = await getDashboardFields(groupId, token, ['Owner_group'], filterString);
    if (response.status === ResponseType.Success) {
      return fulfillWithValue(response);
    }
    return rejectWithValue(response);
  },
);

const organisationsSlice = createSlice({
  name: 'organisationsSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchOrganisations.pending, (state) => {
      state.loading = LoadingState.LOADING;
    });
    builder.addCase(fetchOrganisations.fulfilled, (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.loading = LoadingState.SUCCESS;
    });
    builder.addCase(fetchOrganisations.rejected, (state, action: PayloadAction<any>) => {
      state.loading = LoadingState.ERROR;
      state.data = action.payload;
    });
  },
});

//
export const selectOrganisations = (state: RootState) => state.organisationsState;
export const selectAggregatedOrgs = createSelector(
  selectOrganisations,
  (organisations) => {
    const counts = aggregateArrayObjects('Owner_group', organisations.data.data);
    return counts;
  },
);

export default organisationsSlice.reducer;
