/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import MetadataLoadingState from '../constants/metadataLoadingState';
import { MetaDataColumn, Project } from '../types/dtos';
import { ProjectSample } from '../types/sample.interface';
import { getDisplayFields, getSamples } from '../utilities/resourceUtils';
import type { RootState } from './store';
import { listenerMiddleware } from './listenerMiddleware';

export interface GroupMetadataState {
  groupId: number | null
  loadingState: MetadataLoadingState,
  fields: MetaDataColumn[] | null
  fieldUniqueValues: Record<string, string[]> | null
  metadata: ProjectSample[] | null
  columnLoadingStates: Record<string, LoadingState>
  errorMessage: string | null
}

const groupMetadataInitialStateFactory = (groupId: number): GroupMetadataState => ({
  groupId,
  loadingState: MetadataLoadingState.IDLE,
  fields: null,
  fieldUniqueValues: null,
  metadata: null,
  columnLoadingStates: {},
  errorMessage: null,
});
interface MetadataSliceState {
  data: { [groupId: number]: GroupMetadataState },
  token: string | null, // must be provided by calling component along with each fetch request
}

const initialState: MetadataSliceState = {
  data: {},
  token: null,
};

// TODO replace with generalised thunk that takes requested fields as parameter
const fetchGroupEntireDataset = createAsyncThunk(
  'metadata/fetchGroupEntireDataset',
  async (
    params: any, // { groupId: number },
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<Project | unknown > => {
    const { groupId } = params;
    const { token } = (getState() as RootState).metadataState;
    const response = await getSamples(token!, groupId);
    if (response.status === 'Success') {
      return fulfillWithValue(response.data as ProjectSample[]);
    }
    return rejectWithValue(response.error);
  },
);

const fetchProjectFields = createAsyncThunk(
  'metadata/fetchProjectFields',
  async (
    params: any, // { groupId: number },
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<Project | unknown > => {
    const { groupId } = params;
    const { token } = (getState() as RootState).metadataState;
    const response = await getDisplayFields(groupId, token!);
    if (response.status === 'Success') {
      return fulfillWithValue(response.data as MetaDataColumn[]);
    }
    return rejectWithValue(response.error);
  },
);

// These listeners launch thunks in response to state changes or actions
// The state update triggered by the listener will be the thunk's pending action

// Launch fetchProjectFields in response to metadata fetch request
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't try to read groupId
    if (action.type !== 'metadata/fetchGroupMetadata') return false;
    // Check that the reducer logic is telling us to trigger a new load process
    const previousLoadingState = (previousState as RootState).metadataState
      .data[(action as any).payload.groupId]?.loadingState;
    const loadingState = (currentState as RootState).metadataState
      .data[(action as any).payload.groupId]?.loadingState;
    return previousLoadingState !== MetadataLoadingState.FETCH_REQUESTED &&
           loadingState === MetadataLoadingState.FETCH_REQUESTED;
  },
  effect: (action, listenerApi) => {
    listenerApi.dispatch(
      fetchProjectFields({ groupId: (action as any).payload.groupId }),
    );
  },
});

// Launch needed data view fetches in response to field details loaded
listenerMiddleware.startListening({
  // Could alternatively use predicate with this action and state MetadataLoadingState.FIELDS_LOADED
  type: 'metadata/fetchProjectFields/fulfilled',
  effect: (action, listenerApi) => {
    listenerApi.dispatch(
      fetchGroupEntireDataset({ groupId: (action as any).meta.arg.groupId }),
    );
  },
});

export const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    fetchGroupMetadata: (state, action: PayloadAction<any>) => {
      const { groupId, token } = action.payload;
      if (!state.data[groupId]) {
        // Set initial state for this group
        state.data[groupId] = groupMetadataInitialStateFactory(groupId);
      }
      // Only initialise fetch if in allowed state; do not reload loading data
      if (state.data[groupId].loadingState === MetadataLoadingState.IDLE ||
          state.data[groupId].loadingState === MetadataLoadingState.ERROR ||
          state.data[groupId].loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
        // If we were in an error state and are refreshing, clear data
        if (state.data[groupId].loadingState !== MetadataLoadingState.IDLE) {
          state.data[groupId] = groupMetadataInitialStateFactory(groupId);
        }
        state.data[groupId].loadingState = MetadataLoadingState.FETCH_REQUESTED;
        state.token = token;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProjectFields.pending, (state, action) => {
      const { groupId } = action.meta.arg;
      state.data[groupId].loadingState = MetadataLoadingState.AWAITING_FIELDS;
    });
    builder.addCase(fetchProjectFields.fulfilled, (state, action: PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      state.data[groupId].fields = action.payload;
      // Set column loading states to IDLE for all fields
      state.data[groupId].fields?.forEach((field) => {
        state.data[groupId].columnLoadingStates[field.columnName] = LoadingState.IDLE;
      });
      state.data[groupId].loadingState = MetadataLoadingState.FIELDS_LOADED;
    });
    builder.addCase(fetchProjectFields.rejected, (state, action: PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      state.data[groupId].errorMessage = `Unable to load project fields: ${action.payload}`;
      state.data[groupId].loadingState = MetadataLoadingState.ERROR;
    });
    builder.addCase(fetchGroupEntireDataset.pending, (state, action) => {
      const { groupId } = (action as any).meta.arg;
      // In case where we are loading partial data, will have to consider which fields we expect
      state.data[groupId]?.fields?.forEach(field => {
        state.data[groupId].columnLoadingStates[field.columnName] = LoadingState.LOADING;
      });
      state.data[groupId].loadingState = MetadataLoadingState.AWAITING_DATA;
    });
    builder.addCase(fetchGroupEntireDataset.fulfilled, (state, action:PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      const data = action.payload;
      // Currently we just accept this as the only expected data view
      // In case where we are loading partial data, will have to consider whether returned
      // data supercedes existing data, and whether we have finished loading all fields
      // TODO also consider if we can abort obsolete thunks and requests
      state.data[groupId].metadata = data;
      state.data[groupId].loadingState = MetadataLoadingState.DATA_LOADED;
      for (const [field] of Object.entries(data[0])) {
        state.data[groupId].columnLoadingStates[field] = LoadingState.SUCCESS;
      }
    });
    builder.addCase(fetchGroupEntireDataset.rejected, (state, action: PayloadAction<any>) => {
      const { groupId } = (action as any).meta.arg;
      state.data[groupId].errorMessage = `Unable to load project data: ${action.payload}`;
      state.data[groupId].loadingState = MetadataLoadingState.ERROR;
      // In case where we are loading partial data, will have to consider which fields we expect
      state.data[groupId]?.fields?.forEach(field => {
        state.data[groupId].columnLoadingStates[field.columnName] = LoadingState.ERROR;
      });
    });
  },
});

// reducer
export default metadataSlice.reducer;

// actions only. Thunks are for internal state machine use
export const { fetchGroupMetadata } = metadataSlice.actions;

// selectors

export const selectGroupMetadata:
(state: RootState, groupId: number | undefined) => GroupMetadataState | null =
  (state, groupId) => {
    if (!groupId) return null; // should not be 0, which is fine
    return state.metadataState.data[groupId!] ?? null;
  };

// May want to also include per-field loading state in this selector
export const selectGroupMetadataFields = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return { fields: null, loadingState: null };
  return {
    fields: state.metadataState.data[groupId]?.fields,
    loadingState: state.metadataState.data[groupId]?.loadingState,
  };
};

export const selectGroupMetadataError = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return null;
  return state.metadataState.data[groupId]?.errorMessage;
};
