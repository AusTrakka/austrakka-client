/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ResponseObject } from '../types/responseObject.interface';
import { ResponseType } from '../constants/responseType';
import { GroupRole } from '../types/dtos';
import { getUserGroups } from '../utilities/resourceUtils';
import LoadingState from '../constants/loadingState';
import type { RootState } from '../app/store';

export interface UserSliceState {
  data: Record<string, string[]>,
  admin: boolean,
  errorMessage: string,
  loading: LoadingState,
}

interface FetchUserRolesResponse {
  groupRoles: GroupRole[],
  isAusTrakkaAdmin: boolean,
}

const fetchUserRoles = createAsyncThunk(
  'user/fetchUserRoles',
  async (
    token: string,
    thunkAPI,
  ): Promise<GroupRole[] | unknown> => {
    const groupResponse: ResponseObject = await getUserGroups(token);
    if (groupResponse.status === ResponseType.Success) {
      const { groupRoles, isAusTrakkaAdmin } = groupResponse.data;
      return thunkAPI
        .fulfillWithValue({ groupRoles, isAusTrakkaAdmin } as FetchUserRolesResponse);
    }
    return thunkAPI.rejectWithValue(groupResponse.message);
  },
);

const userSlice = createSlice({
  name: 'userSlice',
  initialState: {
    data: {},
    errorMessage: '',
    loading: LoadingState.IDLE,
  } as UserSliceState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserRoles.pending, (state) => {
        state.loading = LoadingState.LOADING;
      })
      .addCase(fetchUserRoles.fulfilled, (state, action) => {
        state.loading = LoadingState.SUCCESS;
        const holder = action.payload as FetchUserRolesResponse;
        const data: Record<string, string[]> = {};
        holder.groupRoles.forEach((groupRole) => {
          if (data[groupRole.group.name]) {
            data[groupRole.group.name].push(groupRole.role.name);
          } else {
            data[groupRole.group.name] = [groupRole.role.name];
          }
        });
        state.data = data;
        state.admin = holder.isAusTrakkaAdmin;
      })
      .addCase(fetchUserRoles.rejected, (state, action) => {
        state.loading = LoadingState.ERROR;
        state.errorMessage = action.payload as string;
      });
  },
});

export default userSlice.reducer;
export const selectUserState = (state: RootState) : UserSliceState => state.userState;

export { fetchUserRoles };
