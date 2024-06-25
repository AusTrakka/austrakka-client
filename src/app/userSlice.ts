/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ResponseObject } from '../types/responseObject.interface';
import { ResponseType } from '../constants/responseType';
import { GroupRole, User } from '../types/dtos';
import { getMe } from '../utilities/resourceUtils';
import LoadingState from '../constants/loadingState';
import type { RootState } from './store';

export interface UserSliceState {
  groupRolesGrouped: Record<string, string[]>,
  groupRoles: GroupRole[],
  displayName: string,
  admin: boolean,
  orgAbbrev: string,
  orgName: string,
  errorMessage: string,
  loading: LoadingState,
}

interface FetchUserRolesResponse {
  groupRoles: GroupRole[],
  displayName: string,
  isAusTrakkaAdmin: boolean,
  orgAbbrev: string,
  orgName: string,
}

const fetchUserRoles = createAsyncThunk(
  'user/fetchUserRoles',
  async (
    token: string,
    thunkAPI,
  ): Promise<GroupRole[] | unknown> => {
    const groupResponse: ResponseObject = await getMe(token);
    if (groupResponse.status === ResponseType.Success) {
      const { groupRoles, isAusTrakkaAdmin, displayName, orgAbbrev, orgName } =
        groupResponse.data as User;
      return thunkAPI
        .fulfillWithValue({ groupRoles,
          displayName,
          isAusTrakkaAdmin,
          orgAbbrev,
          orgName } as FetchUserRolesResponse);
    }
    return thunkAPI.rejectWithValue(groupResponse.message);
  },
);

const userSlice = createSlice({
  name: 'userSlice',
  initialState: {
    groupRolesGrouped: {},
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
        state.groupRolesGrouped = data;
        state.groupRoles = holder.groupRoles;
        state.admin = holder.isAusTrakkaAdmin;
        state.displayName = holder.displayName;
        state.orgAbbrev = holder.orgAbbrev;
        state.orgName = holder.orgName;
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
