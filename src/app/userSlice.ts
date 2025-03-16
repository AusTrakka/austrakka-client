/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { GroupedPrivilegesByRecordTypeWithScopes, GroupRole, User, UserMe } from '../types/dtos';
import LoadingState from '../constants/loadingState';
import type { RootState } from './store';
import { hasSuperUserRoleInType } from '../utilities/accessTableUtils';

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
      // For now, just a dummy call that mimics an admin
      // const scopes = {
      //   objectId: 'dummy-objectId',
      //   displayName: 'Local User',
      //   contactEmail: '',
      //   orgId: 1,
      //   orgAbbrev: 'None',
      //   orgName: 'None',
      //   analysisServerUsername: '',
      //   scopes
      // }
      
      const groupRoles : GroupRole[] = [{
        role: {
          id: 1,
          name: 'AusTrakkaAdmin',
        },
        group: {
          groupId: 1,
          name: 'AusTrakka-Owner',
          organisation: {
            abbreviation: 'AusTrakka',
            name: 'AusTrakka',
          },
        },
      }];
      
      const scopes : GroupedPrivilegesByRecordTypeWithScopes[] = [{
        recordType: 'Tenant',
        recordRoles: [{
          recordName: 'Local System',
          recordGlobalId: 'local-system-ID',
          roles: [{
            roleName: 'SuperUser',
            privilegeLevel: 1,
            privilegeGlobalId: 'privilege-1',
            scopes: ['*/*'],
          }],
        }],
      }];
      
      // Fulfill with user role data
      return {
        groupRoles,
        displayName: 'Local User',
        isAusTrakkaAdmin: true,
        orgAbbrev: 'None',
        orgName: 'None',
        defaultTenant: 'LocalSystem', // TODO
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
