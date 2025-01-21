/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ResponseObject } from '../types/responseObject.interface';
import { ResponseType } from '../constants/responseType';
import { GroupedPrivilegesByRecordTypeWithScopes, GroupRole, User, UserMe } from '../types/dtos';
import { getMe, getMeV2 } from '../utilities/resourceUtils';
import LoadingState from '../constants/loadingState';
import type { RootState } from './store';
import { hasSuperUserRoleInType } from '../utilities/accessTableUtils';
import { selectTenantState, TenantSliceState } from './tenantSlice';

export interface UserSliceState {
  groupRolesByGroup: Record<string, string[]>,
  groupRoles: GroupRole[],
  displayName: string,
  admin: boolean,
  adminV2: boolean,
  orgAbbrev: string,
  orgName: string,
  errorMessage: string,
  loading: LoadingState,
  scopes: GroupedPrivilegesByRecordTypeWithScopes[],
}

interface FetchUserRolesResponse {
  groupRoles: GroupRole[],
  scopes: GroupedPrivilegesByRecordTypeWithScopes[]
  defaultTenant: string,
  displayName: string,
  isAusTrakkaAdmin: boolean,
  orgAbbrev: string,
  orgName: string,
}

const fetchUserRoles = createAsyncThunk(
  'user/fetchUserRoles',
  async (token: string, thunkAPI): Promise<GroupRole[] | unknown> => {
    try {
      const state = thunkAPI.getState() as RootState;
      const tenant: TenantSliceState = selectTenantState(state);

      if (!tenant.defaultTenantGlobalId) {
        return thunkAPI.rejectWithValue('No default tenant global ID found');
      }

      // Fetch group roles
      const groupResponse: ResponseObject = await getMe(token);
      if (groupResponse.status !== ResponseType.Success) {
        return thunkAPI.rejectWithValue(groupResponse.message);
      }

      // Fetch user scope using tenant globalId
      const scopeResponse: ResponseObject = await getMeV2(
        tenant.defaultTenantGlobalId,
        token,
      );
      if (scopeResponse.status !== ResponseType.Success) {
        return thunkAPI.rejectWithValue(scopeResponse.message);
      }

      // Destructure the response data
      const {
        groupRoles,
        isAusTrakkaAdmin,
        displayName,
        orgAbbrev,
        orgName,
      } = groupResponse.data as User;
      const { scopes } = scopeResponse.data as UserMe;

      // Fulfill with user role data
      return {
        groupRoles,
        displayName,
        isAusTrakkaAdmin,
        orgAbbrev,
        orgName,
        scopes,
      } as FetchUserRolesResponse;
    } catch (error) {
      return thunkAPI.rejectWithValue('An unexpected error occurred');
    }
  },
);

const userSlice = createSlice({
  name: 'userSlice',
  initialState: {
    groupRolesByGroup: {},
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
        state.groupRolesByGroup = data;
        state.groupRoles = holder.groupRoles;
        state.admin = holder.isAusTrakkaAdmin;
        state.adminV2 = hasSuperUserRoleInType(holder.scopes);
        state.displayName = holder.displayName;
        state.orgAbbrev = holder.orgAbbrev;
        state.orgName = holder.orgName;
        state.scopes = holder.scopes;
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
