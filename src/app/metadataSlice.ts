/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import { MetaDataColumn, Project } from '../types/dtos';
import { ProjectSample } from '../types/sample.interface';
import { getDisplayFields, getSamples } from '../utilities/resourceUtils';
import type { RootState } from './store';

export interface GroupMetadataState {
  groupId: number | null
  fields: MetaDataColumn[] | null
  fieldUniqueValues: Record<string, string[]> | null
  metadata: ProjectSample[] | null
  loadingState: LoadingState
  fieldDetailsLoadingState: LoadingState
  fieldDetailsLoadingRequestId: string | null
  columnLoadingStates: Record<string, LoadingState>
  dataLoadingState: LoadingState
  dataLoadingRequestId: string | null
  errorMessage: string | null
}

const groupMetadataInitialStateFactory = (groupId: number): GroupMetadataState => ({
  groupId,
  fields: null,
  fieldUniqueValues: null,
  metadata: null,
  loadingState: LoadingState.IDLE,
  fieldDetailsLoadingState: LoadingState.IDLE,
  fieldDetailsLoadingRequestId: null,
  columnLoadingStates: {},
  dataLoadingState: LoadingState.IDLE,
  dataLoadingRequestId: null,
  errorMessage: null,
});

interface MetadataState {
  data: { [groupId: number]: GroupMetadataState }
}

const initialState: MetadataState = {
  data: {},
};

const fetchGroupEntireDataset = createAsyncThunk(
  'metadata/fetchGroupEntireDataset',
  async (
    params: any, // { groupId: number, token: string },
    { rejectWithValue, fulfillWithValue, getState, requestId },
  ):Promise<Project | unknown > => {
    const { groupId, token } = params;
    const state = getState() as RootState;
    // Expected state: overall state loading, fields loaded, data not loaded
    // For now since this is the only call, we expect data loading state to be IDLE
    // When partial metadata loading is implemented, state may be loading or partially-loaded
    // Not checking fields loading state as there may be a race condition without listeners?
    const loadingState = state.metadataState.data[groupId]?.dataLoadingState;
    const loadingRequestId = state.metadataState.data[groupId]?.dataLoadingRequestId;
    // Do nothing if data already loading or loaded
    if (loadingState &&
        loadingState !== LoadingState.IDLE &&
        !(loadingState === LoadingState.LOADING && requestId === loadingRequestId)) {
      return fulfillWithValue(null);
    }
    // Error condition if overall loading state is not where we expect
    const groupLoadingState = state.metadataState.data[groupId]?.loadingState;
    if (!groupLoadingState || groupLoadingState !== LoadingState.LOADING) {
      // eslint-disable-next-line no-console
      console.log('Error: fetchGroupEntireDataset called when group load state not LOADING');
    }
    const response = await getSamples(token, groupId);
    if (response.status === 'Success') {
      return fulfillWithValue(response.data as ProjectSample[]);
    }
    return rejectWithValue(response.error);
  },
);

const fetchGroupMetadata = createAsyncThunk(
  'metadata/fetchGroupMetadata',
  async (
    params: any, // { groupId: number, token: string },
    { rejectWithValue, fulfillWithValue, dispatch, getState, requestId },
  ):Promise<Project | unknown > => {
    const { groupId, token } = params;
    const state = getState() as RootState;
    const loadingState = state.metadataState.data[groupId]?.fieldDetailsLoadingState;
    const loadingRequestId = state.metadataState.data[groupId]?.fieldDetailsLoadingRequestId;
    // Take action if (i.e. return here if these conditions not fulfilled):
    //   There is no loading state yet, or
    //   There is a loading state but it is IDLE, or
    //   The loading state is LOADING and the requestId is the same as the current requestId
    if (loadingState &&
        loadingState !== LoadingState.IDLE &&
        !(loadingState === LoadingState.LOADING && requestId === loadingRequestId)) {
      return fulfillWithValue(null);
    }
    const response = await getDisplayFields(groupId, token);
    if (response.status === 'Success') {
      // dispatch data loading, for now only loading of whole dataset; later partial as well
      // race condition? fetchGroupEntireDataset.pending may be before fetchGroupMetadata.fulfilled
      dispatch(fetchGroupEntireDataset({ groupId, token }));
      return fulfillWithValue(response.data as MetaDataColumn[]);
    }
    return rejectWithValue(response.error);
  },
);

export const metadataSlice = createSlice({
  name: 'metadataSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchGroupMetadata.pending, (state, action) => {
      const { groupId } = action.meta.arg;
      if (!state.data[groupId]) {
        // Set initial state for this group
        state.data[groupId] = groupMetadataInitialStateFactory(groupId);
      }
      if (!state.data[groupId].loadingState
        || state.data[groupId].loadingState === LoadingState.IDLE) {
        state.data[groupId].loadingState = LoadingState.LOADING;
        state.data[groupId].fieldDetailsLoadingState = LoadingState.LOADING;
        state.data[groupId].fieldDetailsLoadingRequestId = action.meta.requestId;
      }
    });
    builder.addCase(fetchGroupMetadata.fulfilled, (state, action: PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      const data = action.payload;
      // Ideally we want this ignore logic to be here in the reducer
      // However to avoid duplicate API calls the thunk also needs to implement this logic
      // Do logic here then check data==null as a sanity check of thunk correctness
      const loadingState = state.data[groupId]?.fieldDetailsLoadingState;
      const loadingRequestId = state.data[groupId]?.fieldDetailsLoadingRequestId;
      const { requestId } = (action as any).meta;
      const shouldIgnore = loadingState &&
                        loadingState !== LoadingState.IDLE &&
                        !(loadingState === LoadingState.LOADING && requestId === loadingRequestId);
      if (shouldIgnore && data) {
        // eslint-disable-next-line no-console
        console.error('fetchGroupMetadata fulfilled with non-null data but state indicates it should not have executed');
      }
      if (!shouldIgnore) {
        state.data[groupId].fields = data;
        state.data[groupId].fieldDetailsLoadingState = LoadingState.SUCCESS;
        // Set column loading states to IDLE for all fields
        state.data[groupId].fields?.forEach((field) => {
          state.data[groupId].columnLoadingStates[field.columnName] = LoadingState.IDLE;
        });
      }
    });
    builder.addCase(fetchGroupMetadata.rejected, (state, action: PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      state.data[groupId].errorMessage = `Unable to load project fields: ${action.payload}`;
      state.data[groupId].fieldDetailsLoadingState = LoadingState.ERROR;
      state.data[groupId].loadingState = LoadingState.ERROR;
    });
    builder.addCase(fetchGroupEntireDataset.pending, (state, action) => {
      const { groupId } = (action as any).meta.arg;
      if (state.data[groupId] && state.data[groupId].dataLoadingState === LoadingState.IDLE) {
        state.data[groupId].dataLoadingState = LoadingState.LOADING;
        state.data[groupId].dataLoadingRequestId = action.meta.requestId;
        // In case where we are loading partial data, will have to consider which fields we expect
        state.data[groupId]?.fields?.forEach(field => {
          state.data[groupId].columnLoadingStates[field.columnName] = LoadingState.LOADING;
        });
      }
    });
    builder.addCase(fetchGroupEntireDataset.fulfilled, (state, action:PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      const data = action.payload;
      const loadingState = state.data[groupId]?.dataLoadingState;
      const loadingRequestId = state.data[groupId]?.dataLoadingRequestId;
      const { requestId } = (action as any).meta;
      const shouldIgnore = loadingState &&
                        loadingState !== LoadingState.IDLE &&
                        !(loadingState === LoadingState.LOADING && requestId === loadingRequestId);
      if (shouldIgnore && data) {
        // eslint-disable-next-line no-console
        console.error('fetchGroupEntireDataset fulfilled with non-null data but state indicates it should not have executed');
      }
      if (!shouldIgnore) {
        state.data[groupId].metadata = data;
        state.data[groupId].dataLoadingState = LoadingState.SUCCESS;
        state.data[groupId].loadingState = LoadingState.SUCCESS;
        for (const [field] of Object.entries(data[0])) {
          state.data[groupId].columnLoadingStates[field] = LoadingState.SUCCESS;
        }
      }
    });
    builder.addCase(fetchGroupEntireDataset.rejected, (state, action: PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      state.data[groupId].errorMessage = `Unable to load project data: ${action.payload}`;
      state.data[groupId].dataLoadingState = LoadingState.ERROR;
      state.data[groupId].loadingState = LoadingState.ERROR;
      // In case where we are loading partial data, will have to consider which fields we expect
      state.data[groupId]?.fields?.forEach(field => {
        state.data[groupId].columnLoadingStates[field.columnName] = LoadingState.ERROR;
      });
    });
  },
});

// reducer
export default metadataSlice.reducer;

// thunks
export { fetchGroupMetadata };

// selectors

export const selectGroupMetadata:
(state: RootState, groupId: number | undefined) => GroupMetadataState | null =
  (state, groupId) => {
    if (!groupId) return null; // should not be 0, which is fine
    return state.metadataState.data[groupId!] ?? null;
  };

// May want to also include per-field loading state in this selector
export const selectGroupMetadataFields = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return { fields: null, fieldDetailsLoadingState: null };
  return {
    fields: state.metadataState.data[groupId]?.fields,
    fieldDetailsLoadingState: state.metadataState.data[groupId]?.fieldDetailsLoadingState,
  };
};

export const selectGroupMetadataError = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return null;
  return state.metadataState.data[groupId]?.errorMessage;
};
