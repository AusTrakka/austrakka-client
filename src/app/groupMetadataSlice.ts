/* eslint-disable no-param-reassign */
import { PayloadAction, createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import MetadataLoadingState from '../constants/metadataLoadingState';
import { MetaDataColumn } from '../types/dtos';
import { Sample } from '../types/sample.interface';
import { getDisplayFields, getMetadata } from '../utilities/resourceUtils';
import type { RootState } from './store';
import { listenerMiddleware } from './listenerMiddleware';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';

// These are hard-coded desired field sets, used as an interim measure
// until we have project data views implemented server-side.
// Since we don't know that the project will contain all specified fields, we will have to
// request the intersection of the fields here and the actual project fields.
// In addition to views listed here, an all-of-project dataset will be retrieved.
const DATA_VIEWS = [
  [SAMPLE_ID_FIELD],
  [SAMPLE_ID_FIELD, 'Date_coll', 'Owner_group', 'Jurisdiction'],
];

// This is an interim function based on hard-coded views
const calculateDataViews = (fields: MetaDataColumn[]): string[][] => {
  const fieldNames = fields.map(field => field.columnName);
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
  fieldUniqueValues: Record<string, string[] | null> | null
  views: Record<number, string[]>
  viewLoadingStates: Record<number, LoadingState>
  viewToFetch: number
  metadata: Sample[] | null
  columnLoadingStates: Record<string, LoadingState>
  errorMessage: string | null
}

const groupMetadataInitialStateCreator = (groupId: number): GroupMetadataState => ({
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

interface GroupMetadataSliceState {
  data: { [groupId: number]: GroupMetadataState },
  token: string | null, // must be provided by calling component along with each fetch request
}

const initialState: GroupMetadataSliceState = {
  data: {},
  token: null,
};

// Input parameters and return types (on success/fulfilled) for actions and thunks

interface FetchGroupMetadataParams {
  groupId: number,
  token: string,
}

interface FetchGroupFieldsParams {
  groupId: number,
}

interface FetchGroupFieldsResponse {
  fields: MetaDataColumn[],
}

interface FetchDataViewParams {
  groupId: number,
  fields: string[],
  viewIndex: number,
}
interface FetchDataViewsResponse {
  data: Sample[],
}

const fetchGroupFields = createAsyncThunk(
  'groupMetadata/fetchGroupFields',
  async (
    params: FetchGroupFieldsParams,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<FetchGroupFieldsResponse | unknown > => {
    const { groupId } = params;
    const { token } = (getState() as RootState).groupMetadataState;
    const response = await getDisplayFields(groupId, token!);
    if (response.status === 'Success') {
      return fulfillWithValue<FetchGroupFieldsResponse>({
        fields: response.data as MetaDataColumn[],
      });
    }
    return rejectWithValue(response.error);
  },
);

const fetchDataView = createAsyncThunk(
  'groupMetadata/fetchDataView',
  async (
    params: FetchDataViewParams,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<FetchDataViewsResponse | unknown > => {
    const { groupId, fields } = params;
    const { token } = (getState() as RootState).groupMetadataState;
    const response = await getMetadata(groupId, fields, token!);
    if (response.status === 'Success') {
      return fulfillWithValue<FetchDataViewsResponse>({
        data: response.data as Sample[],
      });
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
    if (action.type !== 'groupMetadata/fetchGroupMetadata') return false;
    // Check that the reducer logic is telling us to trigger a new load process
    const previousLoadingState = (previousState as RootState).groupMetadataState
      .data[(action as any).payload.groupId]?.loadingState;
    const loadingState = (currentState as RootState).groupMetadataState
      .data[(action as any).payload.groupId]?.loadingState;
    return previousLoadingState !== MetadataLoadingState.FETCH_REQUESTED &&
           loadingState === MetadataLoadingState.FETCH_REQUESTED;
  },
  effect: (action, listenerApi) => {
    listenerApi.dispatch(
      fetchGroupFields({ groupId: (action as any).payload.groupId }),
    );
  },
});

// Launch needed data view fetch after viewToFetch changes
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't try to read groupId
    if (!isAnyOf(fetchGroupFields.fulfilled, fetchDataView.fulfilled)(action)) return false;
    const { groupId } = (action as any).meta.arg;
    // Check that viewToFetch has incremented
    const previousViewToFetch = (previousState as RootState).groupMetadataState
      .data[groupId]?.viewToFetch;
    const viewToFetch = (currentState as RootState).groupMetadataState
      .data[groupId]?.viewToFetch;
    return viewToFetch === 0 || previousViewToFetch !== viewToFetch;
  },
  effect: (action, listenerApi) => {
    const { groupId } = (action as any).meta.arg;
    const { views, viewToFetch } =
      (listenerApi.getState() as RootState).groupMetadataState.data[groupId];
    // Dispatch the requested next view load, unless it is out of range (i.e. we are finished)
    // Alternatively could test state and stop if MetadataLoadingState.DATA_LOADED
    if (viewToFetch < 0 || viewToFetch >= Object.keys(views).length) return;
    listenerApi.dispatch(
      fetchDataView({ groupId, fields: views[viewToFetch], viewIndex: viewToFetch }),
    );
  },
});

export const groupMetadataSlice = createSlice({
  name: 'groupMetadata',
  initialState,
  reducers: {
    fetchGroupMetadata: (state, action: PayloadAction<FetchGroupMetadataParams>) => {
      const { groupId, token } = action.payload;
      if (!state.data[groupId]) {
        // Set initial state for this group
        state.data[groupId] = groupMetadataInitialStateCreator(groupId);
      }
      // Only initialise fetch if in allowed state; do not reload loading data
      if (state.data[groupId].loadingState === MetadataLoadingState.IDLE ||
          state.data[groupId].loadingState === MetadataLoadingState.ERROR ||
          state.data[groupId].loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
        // If we were in an error state and are refreshing, clear data
        if (state.data[groupId].loadingState !== MetadataLoadingState.IDLE) {
          state.data[groupId] = groupMetadataInitialStateCreator(groupId);
        }
        state.data[groupId].loadingState = MetadataLoadingState.FETCH_REQUESTED;
        state.token = token;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchGroupFields.pending, (state, action) => {
      const { groupId } = action.meta.arg;
      state.data[groupId].loadingState = MetadataLoadingState.AWAITING_FIELDS;
    });
    builder.addCase(fetchGroupFields.fulfilled, (state, action) => {
      const { groupId } = action.meta.arg;
      const { fields } = action.payload as FetchGroupFieldsResponse;
      // Sort fields by columnOrder and set state
      fields.sort((a, b) => a.columnOrder - b.columnOrder);
      state.data[groupId].fields = fields;
      // Set views (field lists), and set view loading states to IDLE for all views
      // This is an interim measure; later we will use a thunk to fetch project data views
      const views = calculateDataViews(fields);
      state.data[groupId].views = {};
      views.forEach((view, index) => {
        state.data[groupId].views![index] = view;
        state.data[groupId].viewLoadingStates![index] = LoadingState.IDLE;
      });
      // Set column loading states to IDLE for all fields, and initialise unique values
      state.data[groupId].fieldUniqueValues = {};
      state.data[groupId].fields!.forEach((field) => {
        state.data[groupId].columnLoadingStates[field.columnName] = LoadingState.IDLE;
        state.data[groupId].fieldUniqueValues![field.columnName] = null;
      });
      state.data[groupId].loadingState = MetadataLoadingState.FIELDS_LOADED;
    });
    builder.addCase(fetchGroupFields.rejected, (state, action) => {
      const { groupId } = action.meta.arg;
      state.data[groupId].errorMessage = `Unable to load group fields: ${action.payload}`;
      state.data[groupId].loadingState = MetadataLoadingState.ERROR;
    });
    builder.addCase(fetchDataView.pending, (state, action) => {
      const { groupId, fields, viewIndex } = action.meta.arg;
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
    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { groupId, fields, viewIndex } = action.meta.arg;
      const { data } = action.payload as FetchDataViewsResponse;
      // Each returned view is a superset of the previous; we always replace the data
      state.data[groupId].metadata = data;
      // Default sort data by Seq_ID, which should be consistent across views.
      // Could be done server-side, in which case this sort operation is redundant but cheap
      if (state.data[groupId].metadata![0][SAMPLE_ID_FIELD]) {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        state.data[groupId].metadata!.sort((a, b) =>
          collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]));
      }
      // Calculate unique values
      // Note that the view is not considered "loaded" until this is done, as we are in the reducer.
      // Would be better to do server-side, but this operation is quite fast.
      // Note that if categorical fields are included in project sub-views, they will be
      // recalculated per-view, to ensure consistency.
      const fieldDetails: MetaDataColumn[] = fields.map(
        field => {
          const fieldDetail = state.data[groupId].fields!.find(f => f.columnName === field);
          if (!fieldDetail) {
            throw new Error(
              'Unexpected error in fetchDataView.fullfilled: ' +
              `field ${field} in data not found in expected fields`,
            );
          }
          return fieldDetail;
        },
      );
      // fields with defined valid values can just be looked up
      const categoricalFields = fieldDetails.filter(field =>
        field.canVisualise && field.metaDataColumnValidValues);
      categoricalFields.forEach(field => {
        state.data[groupId].fieldUniqueValues![field.columnName] = field.metaDataColumnValidValues;
      });
      // visualisable string field unique values must be calculated
      const visualisableFields = fieldDetails.filter(field => field.canVisualise && field.primitiveType === 'string');
      const valueSets : Record<string, Set<string>> = {};
      visualisableFields.forEach(field => {
        valueSets[field.columnName] = new Set();
      });
      data.forEach(sample => {
        visualisableFields.forEach(field => {
          const value = sample[field.columnName];
          // we conflate the string 'null' with empty values, but there may not be a better option
          valueSets[field.columnName].add(value === null ? 'null' : value);
        });
      });
      visualisableFields.forEach(field => {
        state.data[groupId].fieldUniqueValues![field.columnName] =
          Array.from(valueSets[field.columnName]);
      });
      // Sort unique values using natural sort order
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      visualisableFields.forEach(field => {
        state.data[groupId].fieldUniqueValues![field.columnName]!.sort(collator.compare);
      });
      // Set SUCCESS states
      state.data[groupId].viewLoadingStates![viewIndex] = LoadingState.SUCCESS;
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
    builder.addCase(fetchDataView.rejected, (state, action) => {
      const { groupId, fields, viewIndex } = action.meta.arg;
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
        state.data[groupId].errorMessage = `Unable to load metadata: ${action.payload}`;
      } else {
        state.data[groupId].loadingState = MetadataLoadingState.PARTIAL_LOAD_ERROR;
        state.data[groupId].errorMessage = `Unable to complete metadata: ${action.payload}`;
      }
      // Currently we don't try to fetch more views after an error
      // If we want to, we should incremement viewToFetch if there are views left,
      // and set PARTIAL_DATA_LOADED state instead of error states.
    });
  },
});

// reducer
export default groupMetadataSlice.reducer;

// actions only. Thunks are for internal state machine use
export const { fetchGroupMetadata } = groupMetadataSlice.actions;

// selectors

export const selectGroupMetadata:
(state: RootState, groupId: number | undefined) => GroupMetadataState | null =
  (state, groupId) => {
    if (!groupId) return null; // should not be 0, which is fine
    return state.groupMetadataState.data[groupId!] ?? null;
  };

// May want to also include per-field loading state in this selector
export const selectGroupMetadataFields = (state: RootState, groupId: number | undefined) => {
  if (!groupId) {
    return { fields: null, fieldUniqueValues: null, loadingState: MetadataLoadingState.IDLE };
  }
  return {
    fields: state.groupMetadataState.data[groupId]?.fields,
    fieldUniqueValues: state.groupMetadataState.data[groupId]?.fieldUniqueValues,
    loadingState: state.groupMetadataState.data[groupId]?.loadingState,
  };
};

export const selectGroupMetadataError = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return null;
  return state.groupMetadataState.data[groupId]?.errorMessage;
};

// Returns true iff the metadata has not yet loaded to a useable state, i.e. we are awaiting initial
// data. This includes idle and awaiting fields states.
// Returns false if any (including partial) data loaded, or if error state
export const selectAwaitingGroupMetadata = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return true;
  const loadingState = state.groupMetadataState.data[groupId]?.loadingState;
  return loadingState === MetadataLoadingState.IDLE ||
         loadingState === MetadataLoadingState.FETCH_REQUESTED ||
         loadingState === MetadataLoadingState.AWAITING_FIELDS ||
         loadingState === MetadataLoadingState.AWAITING_DATA;
};
