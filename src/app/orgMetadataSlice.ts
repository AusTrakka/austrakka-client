import { createAsyncThunk, createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import { HAS_SEQUENCES, SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import MetadataLoadingState from '../constants/metadataLoadingState';
import RecordTypes from '../constants/record-type.enum';
import type { MetaDataColumn } from '../types/dtos';
import type { Sample } from '../types/sample.interface';
import {
  getLatestActivityTime,
  getOrgFields,
  getOrgMetadataFields,
} from '../utilities/resourceUtils';
import { listenerMiddleware } from './listenerMiddleware';
import {
  getEmptyStringColumns,
  replaceDateStrings,
  replaceHasSequencesNullsWithFalse,
  replaceNullsWithEmpty,
} from './metadataSliceUtils';
import type { RootState } from './store';

// These are hard-coded views mimicking project views. The "full view" will be added automatically.
const DATA_VIEWS = [[SAMPLE_ID_FIELD]];

// This is an interim function based on hard-coded views
const calculateDataViews = (fields: MetaDataColumn[]): string[][] => {
  const fieldNames = fields.map((field) => field.columnName);
  const dataViews = DATA_VIEWS.map((view) =>
    view.filter((field) => fieldNames.includes(field)),
  ).filter((view) => view.length > 0);
  dataViews.push(fieldNames);
  return dataViews;
};

// Note that this state now includes orgAbbrev, which must be supplied as a param,
// implying that orgMetadataSlice is only used for org data. This is currently the case.
// If this were not the case we'd have to make orgAbbrev optional and skip the update checks when null.

export interface OrgMetadataState {
  orgAbbrev: string | null;
  dataLoadTime: string | null;
  loadingState: MetadataLoadingState;
  fields: MetaDataColumn[] | null;
  fieldUniqueValues: Record<string, string[] | null> | null;
  views: Record<number, string[]>;
  viewLoadingStates: Record<number, LoadingState>;
  viewToFetch: number;
  metadata: Sample[] | null;
  columnLoadingStates: Record<string, LoadingState>;
  emptyColumns: string[];
  errorMessage: string | null;
}

const orgMetadataInitialStateCreator = (orgAbbrev: string): OrgMetadataState => ({
  orgAbbrev: orgAbbrev,
  dataLoadTime: null,
  loadingState: MetadataLoadingState.IDLE,
  fields: null,
  fieldUniqueValues: null,
  views: {},
  viewLoadingStates: {},
  viewToFetch: 0,
  metadata: null,
  columnLoadingStates: {},
  emptyColumns: [],
  errorMessage: null,
});

interface OrgMetadataSliceState {
  data: { [orgAbbrev: string]: OrgMetadataState };
  token: string | null; // must be provided by calling component along with each fetch request
}

const initialState: OrgMetadataSliceState = {
  data: {},
  token: null,
};

// Input parameters and return types (on success/fulfilled) for actions and thunks

interface FetchOrgMetadataParams {
  token: string;
  orgAbbrev: string;
}

interface FetchOrgFieldsParams {
  orgAbbrev: string;
}

interface FetchOrgFieldsResponse {
  fields: MetaDataColumn[];
}

interface FetchDataViewParams {
  orgAbbrev: string;
  fields: string[];
  viewIndex: number;
}
interface FetchDataViewResponse {
  data: Sample[];
}

interface FetchLatestActivityTimeParams {
  orgAbbrev: string; // could get from state, but would like to track in params
}

interface FetchLatestActivityTimeResponse {
  timestamp: string;
}

const getOrgLatestActivityTime = createAsyncThunk(
  'orgMetadata/getOrgLatestActivityTime',
  async (
    params: FetchLatestActivityTimeParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchLatestActivityTimeResponse | unknown> => {
    const { orgAbbrev } = params;
    const { token } = (getState() as RootState).orgMetadataState;
    const response = await getLatestActivityTime(RecordTypes.ORGANISATION, token!, orgAbbrev!);
    if (response.status !== 'Success') {
      return rejectWithValue(response.error);
    }
    return fulfillWithValue<FetchLatestActivityTimeResponse>({ timestamp: response.data! });
  },
);

const fetchOrgFields = createAsyncThunk(
  'orgMetadata/fetchOrgFields',
  async (
    params: FetchOrgFieldsParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchOrgFieldsResponse | unknown> => {
    const { orgAbbrev } = params;
    const { token } = (getState() as RootState).orgMetadataState;
    const response = await getOrgFields(orgAbbrev, token!);
    if (response.status === 'Success') {
      return fulfillWithValue<FetchOrgFieldsResponse>({
        fields: response.data ?? [],
      });
    }
    return rejectWithValue(response.error);
  },
);

const fetchDataView = createAsyncThunk(
  'orgMetadata/fetchDataView',
  async (
    params: FetchDataViewParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchDataViewResponse | unknown> => {
    const { orgAbbrev, fields } = params;
    const { token } = (getState() as RootState).orgMetadataState;
    const response = await getOrgMetadataFields(orgAbbrev, fields, token!);
    if (response.status === 'Success') {
      return fulfillWithValue<FetchDataViewResponse>({
        data: response.data ?? [],
      });
    }
    return rejectWithValue(response.error);
  },
);

// These listeners launch thunks in response to state changes or actions
// The state update triggered by the listener will be the thunk's pending action

// Launch getOrgLatestActivityTime in response to CHECK_FOR_UPDATE state
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    if (action.type !== 'orgMetadata/fetchOrgMetadata') return false;
    const previousLoadingState = (previousState as RootState).orgMetadataState.data[
      (action as any).payload.orgAbbrev
    ]?.loadingState;
    const loadingState = (currentState as RootState).orgMetadataState.data[
      (action as any).payload.orgAbbrev
    ]?.loadingState;
    return (
      previousLoadingState !== MetadataLoadingState.CHECK_FOR_UPDATE &&
      loadingState === MetadataLoadingState.CHECK_FOR_UPDATE
    );
  },
  effect: (action, listenerApi) => {
    listenerApi.dispatch(
      getOrgLatestActivityTime({
        orgAbbrev: (action as any).payload.orgAbbrev,
      }),
    );
  },
});

// Launch fetchOrgFields when FETCH_REQUESTED is set (initial load, explicit reload request, or stale data check)
const FETCH_REQUESTED_ACTIONS = [
  'orgMetadata/fetchOrgMetadata',
  'orgMetadata/reloadOrgMetadata',
  getOrgLatestActivityTime.fulfilled.type,
];
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't spend time reading state
    if (!FETCH_REQUESTED_ACTIONS.includes(action.type)) return false;
    const orgAbbrev = (action as any)?.payload?.orgAbbrev ?? (action as any)?.meta?.arg?.orgAbbrev;
    if (!orgAbbrev) return false;
    // biome-ignore format: readability
    const previousLoadingState =
      (previousState as RootState).orgMetadataState.data[orgAbbrev]?.loadingState;
    const loadingState = (currentState as RootState).orgMetadataState.data[orgAbbrev]?.loadingState;
    return (
      previousLoadingState !== MetadataLoadingState.FETCH_REQUESTED &&
      loadingState === MetadataLoadingState.FETCH_REQUESTED
    );
  },
  effect: (action, listenerApi) => {
    const orgAbbrev = (action as any)?.payload?.orgAbbrev ?? (action as any)?.meta?.arg?.orgAbbrev;
    listenerApi.dispatch(fetchOrgFields({ orgAbbrev }));
  },
});

// Launch needed data view fetch after viewToFetch changes
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't try to read orgAbbrev
    if (!isAnyOf(fetchOrgFields.fulfilled, fetchDataView.fulfilled)(action)) return false;
    const { orgAbbrev } = (action as any).meta.arg;
    // Check that viewToFetch has incremented
    const previousViewToFetch = (previousState as RootState).orgMetadataState.data[orgAbbrev]
      ?.viewToFetch;
    const viewToFetch = (currentState as RootState).orgMetadataState.data[orgAbbrev]?.viewToFetch;
    return viewToFetch === 0 || previousViewToFetch !== viewToFetch;
  },
  effect: (action, listenerApi) => {
    const { orgAbbrev } = (action as any).meta.arg;
    const { views, viewToFetch } = (listenerApi.getState() as RootState).orgMetadataState.data[
      orgAbbrev
    ];
    // Dispatch the requested next view load, unless it is out of range (i.e. we are finished)
    // Alternatively could test state and stop if MetadataLoadingState.DATA_LOADED
    if (viewToFetch < 0 || viewToFetch >= Object.keys(views).length) return;
    listenerApi.dispatch(
      fetchDataView({ orgAbbrev, fields: views[viewToFetch], viewIndex: viewToFetch }),
    );
  },
});

export const orgMetadataSlice = createSlice({
  name: 'orgMetadata',
  initialState,
  reducers: {
    fetchOrgMetadata: (state, action: PayloadAction<FetchOrgMetadataParams>) => {
      const { token, orgAbbrev } = action.payload;
      if (!state.data[orgAbbrev]) {
        // Set initial state for this org
        state.data[orgAbbrev] = orgMetadataInitialStateCreator(orgAbbrev);
      }
      // If data is not loaded, initialise fetch
      // If data is loaded, dispatch call to check timestamp for data updates
      // If we are in any other state (i.e. partway through load), do nothing, allow the load process to complete
      if (
        state.data[orgAbbrev].loadingState === MetadataLoadingState.IDLE ||
        state.data[orgAbbrev].loadingState === MetadataLoadingState.ERROR ||
        state.data[orgAbbrev].loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
      ) {
        // If we were in an error state and are refreshing, clear data
        if (state.data[orgAbbrev].loadingState !== MetadataLoadingState.IDLE) {
          state.data[orgAbbrev] = orgMetadataInitialStateCreator(orgAbbrev);
        }
        state.data[orgAbbrev].loadingState = MetadataLoadingState.FETCH_REQUESTED;
        state.token = token;
        state.data[orgAbbrev].orgAbbrev = orgAbbrev;
      } else if (state.data[orgAbbrev].loadingState === MetadataLoadingState.DATA_LOADED) {
        state.data[orgAbbrev].loadingState = MetadataLoadingState.CHECK_FOR_UPDATE;
        state.token = token;
        state.data[orgAbbrev].orgAbbrev = orgAbbrev;
      }
    },
    reloadOrgMetadata: (state, action: PayloadAction<FetchOrgMetadataParams>) => {
      const { token, orgAbbrev } = action.payload;
      // Clear state and start again
      state.data[orgAbbrev] = orgMetadataInitialStateCreator(orgAbbrev);
      state.data[orgAbbrev].loadingState = MetadataLoadingState.FETCH_REQUESTED;
      state.token = token;
      state.data[orgAbbrev].orgAbbrev = orgAbbrev;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getOrgLatestActivityTime.fulfilled, (state, action) => {
      const { orgAbbrev } = action.meta.arg;
      const { timestamp } = action.payload as FetchLatestActivityTimeResponse;
      const currentTimestamp = state.data[orgAbbrev]?.dataLoadTime;
      // If there is no stored timestamp, or the retrieved timestamp is newer, trigger a full reload
      if (!currentTimestamp || new Date(timestamp) > new Date(currentTimestamp)) {
        state.data[orgAbbrev].loadingState = MetadataLoadingState.FETCH_REQUESTED;
      } else {
        // Data is up to date; return to loaded state
        state.data[orgAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
      }
    });
    builder.addCase(getOrgLatestActivityTime.rejected, (state, action) => {
      const { orgAbbrev } = action.meta.arg;
      state.data[orgAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
      //biome-ignore lint/suspicious/noConsole: interim error logging
      console.error(
        `Failed to check for data updates in organisation ${orgAbbrev}: ${action.payload}`,
      );
    });

    builder.addCase(fetchOrgFields.pending, (state, action) => {
      const { orgAbbrev } = action.meta.arg;
      state.data[orgAbbrev] = orgMetadataInitialStateCreator(orgAbbrev);
      state.data[orgAbbrev].loadingState = MetadataLoadingState.AWAITING_FIELDS;
    });
    builder.addCase(fetchOrgFields.fulfilled, (state, action) => {
      const { orgAbbrev } = action.meta.arg;
      const { fields } = action.payload as FetchOrgFieldsResponse;
      // Sort fields by columnOrder and set state
      fields.sort((a, b) => a.columnOrder - b.columnOrder);
      state.data[orgAbbrev].fields = fields;
      // Set views (field lists), and set view loading states to IDLE for all views
      // This is an interim measure; later we will use a thunk to fetch project data views
      const views = calculateDataViews(fields);
      state.data[orgAbbrev].views = {};
      views.forEach((view, index) => {
        state.data[orgAbbrev].views![index] = view;
        state.data[orgAbbrev].viewLoadingStates![index] = LoadingState.IDLE;
      });
      // Set column loading states to IDLE for all fields, and initialise unique values
      state.data[orgAbbrev].fieldUniqueValues = {};
      state.data[orgAbbrev].fields!.forEach((field) => {
        state.data[orgAbbrev].columnLoadingStates[field.columnName] = LoadingState.IDLE;
        state.data[orgAbbrev].fieldUniqueValues![field.columnName] = null;
      });
      state.data[orgAbbrev].loadingState = MetadataLoadingState.FIELDS_LOADED;
    });
    builder.addCase(fetchOrgFields.rejected, (state, action) => {
      const { orgAbbrev } = action.meta.arg;
      state.data[orgAbbrev].errorMessage = `Unable to load org fields: ${action.payload}`;
      state.data[orgAbbrev].loadingState = MetadataLoadingState.ERROR;
    });
    builder.addCase(fetchDataView.pending, (state, action) => {
      const { orgAbbrev, fields, viewIndex } = action.meta.arg;
      state.data[orgAbbrev].viewLoadingStates![viewIndex] = LoadingState.LOADING;
      // If not yet awaiting, start awaiting; if AWAITING or PARTIAL_DATA_LOADED, no change
      if (viewIndex === 0) {
        state.data[orgAbbrev].loadingState = MetadataLoadingState.AWAITING_DATA;
      }
      fields.forEach((field) => {
        // Check per-column state; columns new in this load get LOADING status
        if (state.data[orgAbbrev].columnLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[orgAbbrev].columnLoadingStates[field] = LoadingState.LOADING;
        }
      });
    });
    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { orgAbbrev, fields, viewIndex } = action.meta.arg;
      const { data } = action.payload as FetchDataViewResponse;
      const viewFields = state.data[orgAbbrev].views[viewIndex];
      // Each returned view is a superset of the previous; we always replace the data
      if (viewFields.includes(HAS_SEQUENCES)) {
        replaceHasSequencesNullsWithFalse(data);
      }
      replaceNullsWithEmpty(data);
      state.data[orgAbbrev].emptyColumns = getEmptyStringColumns(data, viewFields);
      replaceDateStrings(data, state.data[orgAbbrev].fields!, viewFields);
      state.data[orgAbbrev].metadata = data;
      // Default sort data by Seq_ID, which should be consistent across views.
      // Could be done server-side, in which case this sort operation is redundant but cheap
      if (
        state.data[orgAbbrev].metadata!.length > 0 &&
        state.data[orgAbbrev].metadata![0][SAMPLE_ID_FIELD]
      ) {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        state.data[orgAbbrev].metadata!.sort((a, b) =>
          collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]),
        );
      }
      // Calculate unique values
      // Note that the view is not considered "loaded" until this is done, as we are in the reducer.
      // Would be better to do server-side, but this operation is quite fast.
      // Note that if categorical fields are included in project sub-views, they will be
      // recalculated per-view, to ensure consistency.
      const fieldDetails: MetaDataColumn[] = fields.map((field) => {
        const fieldDetail = state.data[orgAbbrev].fields!.find((f) => f.columnName === field);
        if (!fieldDetail) {
          throw new Error(
            'Unexpected error in fetchDataView.fullfilled: ' +
              `field ${field} in data not found in expected fields`,
          );
        }
        return fieldDetail;
      });
      // fields with defined valid values can just be looked up
      const categoricalFields = fieldDetails.filter(
        (field) => field.canVisualise && field.metaDataColumnValidValues,
      );
      categoricalFields.forEach((field) => {
        state.data[orgAbbrev].fieldUniqueValues![field.columnName] =
          field.metaDataColumnValidValues;
      });
      // visualisable string field unique values must be calculated
      const visualisableFields = fieldDetails.filter(
        (field) => field.canVisualise && field.primitiveType === 'string',
      );
      const valueSets: Record<string, Set<string>> = {};
      visualisableFields.forEach((field) => {
        valueSets[field.columnName] = new Set();
      });
      data.forEach((sample) => {
        visualisableFields.forEach((field) => {
          const value = sample[field.columnName];
          // we conflate the string 'null' with empty values, but there may not be a better option
          valueSets[field.columnName].add(value === null ? 'null' : value);
        });
      });
      visualisableFields.forEach((field) => {
        state.data[orgAbbrev].fieldUniqueValues![field.columnName] = Array.from(
          valueSets[field.columnName],
        );
      });
      // Sort unique values using natural sort order
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      visualisableFields.forEach((field) => {
        state.data[orgAbbrev].fieldUniqueValues![field.columnName]!.sort(collator.compare);
      });
      // Set SUCCESS states
      state.data[orgAbbrev].viewLoadingStates![viewIndex] = LoadingState.SUCCESS;
      fields.forEach((field) => {
        state.data[orgAbbrev].columnLoadingStates[field] = LoadingState.SUCCESS;
      });
      // Increment viewToFetch, which will trigger the next view load
      state.data[orgAbbrev].viewToFetch = viewIndex + 1;
      // If this is the full dataset, we are done, otherwise we are in a partial load state
      if (viewIndex === Object.keys(state.data[orgAbbrev].views).length - 1) {
        // NB here expect also that fields.length === state.data[orgAbbrev].fields?.length
        state.data[orgAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
        state.data[orgAbbrev].dataLoadTime = new Date().toISOString();
      } else {
        state.data[orgAbbrev].loadingState = MetadataLoadingState.PARTIAL_DATA_LOADED;
      }
    });
    builder.addCase(fetchDataView.rejected, (state, action) => {
      const { orgAbbrev, fields, viewIndex } = action.meta.arg;
      state.data[orgAbbrev].viewLoadingStates![viewIndex] = LoadingState.ERROR;
      // Any column not already loaded by another thunk gets an error state
      fields.forEach((field) => {
        if (state.data[orgAbbrev].columnLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[orgAbbrev].columnLoadingStates[field] = LoadingState.ERROR;
        }
      });
      // If this is the first view, we are in an error state, otherwise a partial error state
      if (viewIndex === 0) {
        state.data[orgAbbrev].loadingState = MetadataLoadingState.ERROR;
        state.data[orgAbbrev].errorMessage = `Unable to load metadata: ${action.payload}`;
      } else {
        state.data[orgAbbrev].loadingState = MetadataLoadingState.PARTIAL_LOAD_ERROR;
        state.data[orgAbbrev].errorMessage = `Unable to complete metadata: ${action.payload}`;
      }
      // Currently we don't try to fetch more views after an error
      // If we want to, we should incremement viewToFetch if there are views left,
      // and set PARTIAL_DATA_LOADED state instead of error states.
    });
  },
});

// reducer
export default orgMetadataSlice.reducer;

// actions only. Thunks are for internal state machine use
export const { fetchOrgMetadata, reloadOrgMetadata } = orgMetadataSlice.actions;

// selectors

export const selectGroupMetadata: (
  state: RootState,
  orgAbbrev: string | undefined,
) => OrgMetadataState | null = (state, orgAbbrev) => {
  if (!orgAbbrev) return null; // should not be 0, which is fine
  return state.orgMetadataState.data[orgAbbrev!] ?? null;
};

// Returns true iff the metadata has not yet loaded to a useable state, i.e. we are awaiting initial
// data. This includes idle and awaiting fields states.
// Returns false if any (including partial) data loaded, or if error state
export const selectAwaitingGroupMetadata = (state: RootState, orgAbbrev: string | undefined) => {
  if (!orgAbbrev) return true;
  const loadingState = state.orgMetadataState.data[orgAbbrev]?.loadingState;
  return (
    loadingState === MetadataLoadingState.IDLE ||
    loadingState === MetadataLoadingState.FETCH_REQUESTED ||
    loadingState === MetadataLoadingState.AWAITING_FIELDS ||
    loadingState === MetadataLoadingState.AWAITING_DATA
  );
};
