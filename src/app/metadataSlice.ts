/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import MetadataLoadingState from '../constants/metadataLoadingState';
import { MetaDataColumn, Project } from '../types/dtos';
import { ProjectSample } from '../types/sample.interface';
import { getDisplayFields, getMetadata } from '../utilities/resourceUtils';
import type { RootState } from './store';
import { listenerMiddleware } from './listenerMiddleware';

// These are hard-coded desired field sets, used as an interim measure
// until we have project data views implemented server-side.
// Since we don't know that the project will contain all specified fields, we will have to
// request the intersection of the fields here and the actual project fields.
// In addition to views listed here, an all-of-project dataset will be retrieved.
const DATA_VIEWS = [
  ['Seq_ID'],
  ['Seq_ID', 'Date_coll', 'Owner_group', 'Jurisdiction'],
];

// This is an interim function based on hard-coded views
const calculateDataViews = (fields: MetaDataColumn[]): string[][] => {
  const fieldNames = fields.map(field => field.columnName);
  // break fieldnames to test what happens when full view fails to load - partial load error state
  // fieldNames.push('not_a_field');
  const dataViews = DATA_VIEWS
    .map(view => view.filter(field => fieldNames.includes(field)))
    .filter(view => view.length > 0);
  dataViews.push(fieldNames);
  return dataViews;
};

export interface GroupMetadataState {
  groupId: number | null
  loadingState: MetadataLoadingState,
  fields: MetaDataColumn[] | null
  fieldUniqueValues: Record<string, string[]> | null
  views: Record<number, string[]>
  viewLoadingStates: Record<number, LoadingState>
  viewToFetch: number
  metadata: ProjectSample[] | null
  columnLoadingStates: Record<string, LoadingState>
  errorMessage: string | null
}

const groupMetadataInitialStateFactory = (groupId: number): GroupMetadataState => ({
  groupId,
  loadingState: MetadataLoadingState.IDLE,
  fields: null,
  fieldUniqueValues: null,
  views: {},
  viewLoadingStates: {},
  viewToFetch: 0,
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

const fetchDataView = createAsyncThunk(
  'metadata/fetchDataView',
  async (
    params: any, // { groupId: number, fields: string[], viewIndex: number }
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<Project | unknown > => {
    const { groupId, fields } = params;
    const { token } = (getState() as RootState).metadataState;
    // Extra sleep on full view if we want to test what happens when in a partial data load state
    // if (getState().metadataState.data[groupId].fields.length === fields.length)
    //  await new Promise(resolve => setTimeout(resolve, 4000));
    const response = await getMetadata(groupId, fields, token!);
    if (response.status === 'Success') {
      return fulfillWithValue(response.data as ProjectSample[]);
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

// Launch needed data view fetch after viewToFetch changes
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't try to read groupId
    if (!isAnyOf(fetchProjectFields.fulfilled, fetchDataView.fulfilled)(action)) return false;
    const { groupId } = (action as any).meta.arg;
    // Check that viewToFetch has incremented
    const previousViewToFetch = (previousState as RootState).metadataState
      .data[groupId]?.viewToFetch;
    const viewToFetch = (currentState as RootState).metadataState
      .data[groupId]?.viewToFetch;
    return viewToFetch === 0 || previousViewToFetch !== viewToFetch;
  },
  effect: (action, listenerApi) => {
    const { groupId } = (action as any).meta.arg;
    const { views, viewToFetch } =
      (listenerApi.getState() as RootState).metadataState.data[groupId];
    // Dispatch the requested next view load, unless it is out of range (i.e. we are finished)
    // Alternatively could test state and stop if MetadataLoadingState.DATA_LOADED
    if (viewToFetch < 0 || viewToFetch >= Object.keys(views).length) return;
    listenerApi.dispatch(
      fetchDataView({ groupId, fields: views[viewToFetch], viewIndex: viewToFetch }),
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
      const fields = action.payload;
      state.data[groupId].fields = fields;
      // Set views (field lists), and set view loading states to IDLE for all views
      // This is an interim measure; later we will use a thunk to fetch project data views
      const views = calculateDataViews(fields);
      views.forEach((view, index) => {
        state.data[groupId].views![index] = view;
        state.data[groupId].viewLoadingStates![index] = LoadingState.IDLE;
      });
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
    builder.addCase(fetchDataView.pending, (state, action) => {
      const { groupId, fields, viewIndex } = (action as any).meta.arg as {
        groupId: number, fields: string[], viewIndex: number };
      state.data[groupId].viewLoadingStates![viewIndex] = LoadingState.LOADING;
      // If not yet awaiting, start awaiting; if AWAITING or PARTIAL_DATA_LOADED, no change
      if (viewIndex === 0) {
        state.data[groupId].loadingState = MetadataLoadingState.AWAITING_DATA;
      }
      fields.forEach(field => {
        // Check per-column state; columns new in this load get LOADING status
        if (state.data[groupId].columnLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[groupId].columnLoadingStates[field] = LoadingState.LOADING;
        }
      });
    });
    builder.addCase(fetchDataView.fulfilled, (state, action:PayloadAction<any>) => {
      const { groupId, fields, viewIndex } = (action as any).meta.arg as {
        groupId: number, fields: string[], viewIndex: number };
      const data = action.payload;
      state.data[groupId].viewLoadingStates![viewIndex] = LoadingState.SUCCESS;
      // Each returned view is a superset of the previous; we always replace the data
      state.data[groupId].metadata = data;
      fields.forEach(field => {
        state.data[groupId].columnLoadingStates[field] = LoadingState.SUCCESS;
      });
      // Increment viewToFetch, which will trigger the next view load
      state.data[groupId].viewToFetch = viewIndex + 1;
      // If this is the full dataset, we are done, otherwise we are in a partial load state
      if (viewIndex === Object.keys(state.data[groupId].views).length - 1) {
        // NB here expect also that fields.length === state.data[groupId].fields?.length
        state.data[groupId].loadingState = MetadataLoadingState.DATA_LOADED;
      } else {
        state.data[groupId].loadingState = MetadataLoadingState.PARTIAL_DATA_LOADED;
      }
    });
    builder.addCase(fetchDataView.rejected, (state, action: PayloadAction<any>) => {
      const { groupId, fields, viewIndex } = (action as any).meta.arg as {
        groupId: number, fields: string[], viewIndex: number };
      state.data[groupId].viewLoadingStates![viewIndex] = LoadingState.ERROR;
      // Any column not already loaded by another thunk gets an error state
      fields.forEach(field => {
        if (state.data[groupId].columnLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[groupId].columnLoadingStates[field] = LoadingState.ERROR;
        }
      });
      // If this is the first view, we are in an error state, otherwise a partial error state
      if (viewIndex === 0) {
        state.data[groupId].loadingState = MetadataLoadingState.ERROR;
        state.data[groupId].errorMessage = `Unable to load project data: ${action.payload}`;
      } else {
        state.data[groupId].loadingState = MetadataLoadingState.PARTIAL_LOAD_ERROR;
        state.data[groupId].errorMessage = `Unable to complete loading project data: ${action.payload}`;
      }
      // Currently we don't try to fetch more views after an error
      // If we want to, we should incremement viewToFetch if there are views left,
      // and set PARTIAL_DATA_LOADED state instead of error states.
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

// Returns true iff the metadata has not yet loaded to a useable state, i.e. we are awaiting initial
// data. This includes idle and awaiting fields states.
// Returns false if any (including partial) data loaded, or if error state
export const selectAwaitingGroupMetadata = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return true;
  const loadingState = state.metadataState.data[groupId]?.loadingState;
  return loadingState === MetadataLoadingState.IDLE ||
         loadingState === MetadataLoadingState.FETCH_REQUESTED ||
         loadingState === MetadataLoadingState.AWAITING_FIELDS ||
         loadingState === MetadataLoadingState.AWAITING_DATA;
};
