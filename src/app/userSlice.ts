/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ResponseObject } from '../types/responseObject.interface';
import { ResponseType } from '../constants/responseType';
import { UserRoleGroup } from '../types/dtos';
import { getUserGroups } from '../utilities/resourceUtils';
import LoadingState from '../constants/loadingState';
import { AppState } from '../types/app.interface';

export interface UserSliceState {
  data: Record<string, string[]>,
  errorMessage: string,
  loading: LoadingState,
}

const fetchUserRoles = createAsyncThunk(
  'user/fetchUserRoles',
  async (
    token: string,
    thunkAPI,
  ): Promise<UserRoleGroup[] | unknown> => {
    const groupResponse: ResponseObject = await getUserGroups(token);
    if (groupResponse.status === ResponseType.Success) {
      const { userRoleGroup } = groupResponse.data;
      return thunkAPI.fulfillWithValue(userRoleGroup);
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
        const holder = action.payload as UserRoleGroup[];
        const data: Record<string, string[]> = {};
        holder.forEach((roleGroup) => {
          if (data[roleGroup.group.name]) {
            data[roleGroup.group.name].push(roleGroup.role.name);
          } else {
            data[roleGroup.group.name] = [roleGroup.role.name];
          }
        });
        state.data = data;
      })
      .addCase(fetchUserRoles.rejected, (state, action) => {
        state.loading = LoadingState.ERROR;
        state.errorMessage = action.payload as string;
      });
  },
});

export default userSlice.reducer;
export const selectUserState = (state: AppState) : UserSliceState => state.userState;

export { fetchUserRoles };
