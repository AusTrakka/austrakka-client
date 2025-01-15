import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ResponseObject } from '../types/responseObject.interface';
import { getTenant } from '../utilities/resourceUtils';
import { ResponseType } from '../constants/responseType';
import LoadingState from '../constants/loadingState';
import type { RootState } from './store';

export interface TenantSliceState {
  defaultTenantGlobalId: string,
  defaultTenantName: string,
  loading: LoadingState,
  errorMessage: string,
}

interface FetchDefaultTenantResponse {
  globalId: string,
  name: string,
}

const fetchDefaultTenant = createAsyncThunk(
  'user/fetchDefaultTenant',
  async (
    token: string,
    thunkAPI,
  ): Promise<string | unknown> => {
    try {
      const defaultTenantObject: ResponseObject = await getTenant(token);
      if (defaultTenantObject.status !== ResponseType.Success) {
        return thunkAPI.rejectWithValue(defaultTenantObject.message);
      }
      return thunkAPI.fulfillWithValue({
        globalId: defaultTenantObject.data.globalId,
        name: defaultTenantObject.data.name,
      } as FetchDefaultTenantResponse);
    } catch (error) {
      return thunkAPI.rejectWithValue('An unexpected error occurred');
    }
  },
);

const tenantSlice = createSlice({
  name: 'tenantSlice',
  initialState: {
    defaultTenantGlobalId: '',
    loading: LoadingState.IDLE,
    errorMessage: '',
  } as TenantSliceState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDefaultTenant.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchDefaultTenant.fulfilled, (state, action) => {
        state.loading = LoadingState.SUCCESS;
        const holder = action.payload as FetchDefaultTenantResponse;
        state.defaultTenantGlobalId = holder.globalId;
        state.defaultTenantName = holder.name;
      })
      .addCase(fetchDefaultTenant.rejected, (state, action) => {
        state.loading = LoadingState.ERROR;
        state.errorMessage = action.payload as string;
      });
  },
});

export default tenantSlice.reducer;
export const selectTenantState = (state: RootState) : TenantSliceState => state.tenantState;

export { fetchDefaultTenant };
