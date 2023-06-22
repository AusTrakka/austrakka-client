/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { SubmittingOrgs } from './submitting.orgs.interface';
import { AppState } from '../../../types/app.interface';
import { ResponseObject } from '../../../utilities/resourceUtils';
import LoadingState from '../../../constants/loadingState';

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
    timeFilter:string,
    { rejectWithValue, fulfillWithValue },
  ):Promise<ResponseObject | unknown> => {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = {
      status: 'Success',
      message: '',
      data: [
        {
          ownerGroup: 'LAB1',
          orgName: 'LAB1',
          samplesUploaded: '12',
        },
        {
          ownerGroup: 'LAB2',
          orgName: 'LAB2',
          samplesUploaded: '320',
        },
        {
          ownerGroup: 'LAB3',
          orgName: 'LAB3',
          samplesUploaded: '180',
        },
        {
          ownerGroup: 'LAB4',
          orgName: 'LAB4',
          samplesUploaded: '38',
        },
        {
          ownerGroup: 'LAB5',
          orgName: 'LAB5',
          samplesUploaded: '50',
        },

      ],
    } as ResponseObject;
    if (response.status === 'Success') { return fulfillWithValue(response); }
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

export default submittingOrgsSlice.reducer;
