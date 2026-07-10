import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  DATE_CREATED,
  DATE_UPDATED,
  HAS_SEQUENCES,
  SAMPLE_ID_FIELD,
} from '../constants/metadataConsts';
import MetadataLoadingState from '../constants/metadataLoadingState';
import RecordTypes from '../constants/record-type.enum';
import type { MetaDataColumn } from '../types/dtos';
import type { Sample } from '../types/sample.interface';
import {
  getLatestActivityTime,
  getOrgFields,
  getOrgMetadataByField,
} from '../utilities/resourceUtils';
import { listenerMiddleware } from './listenerMiddleware';
import {
  compareDatesDesc,
  getEmptyStringColumns,
  replaceDateStrings,
  replaceHasSequencesNullsWithFalse,
  replaceNullsWithEmpty,
} from './metadataSliceUtils';
import type { RootState } from './store';

// Note that this state includes orgAbbrev, which must be supplied as a param,
// implying that groupMetadataSlice is only used for org data. This is currently the case.
// If this were not the case we'd have to make orgAbbrev optional and skip the update checks when null.

export interface OrgMetadataState {
  orgAbbrev: string | null;
  dataLoadTime: string | null;
  loadingState: MetadataLoadingState;
  fields: MetaDataColumn[] | null;
  fieldUniqueValues: Record<string, string[] | null> | null;
  metadata: Sample[] | null;
  emptyColumns: string[];
  errorMessage: string | null;
  isDataStale: boolean;
}

const orgMetadataInitialStateCreator = (orgAbbrev: string): OrgMetadataState => ({
  orgAbbrev: orgAbbrev,
  dataLoadTime: null,
  loadingState: MetadataLoadingState.IDLE,
  fields: null,
  fieldUniqueValues: null,
  metadata: null,
  emptyColumns: [],
  errorMessage: null,
  isDataStale: false,
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

interface PollOrgStalenessResponse {
  orgAbbrev: string;
  isStale: boolean;
}

const pollOrgStaleness = createAsyncThunk(
  'orgMetadata/pollOrgStaleness',
  async (
    params: { orgAbbrev: string },
    { rejectWithValue, getState },
  ): Promise<PollOrgStalenessResponse | unknown> => {
    const { orgAbbrev } = params;
    const state = getState() as RootState;
    const { token } = state.orgMetadataState;
    const currentTimestamp = state.orgMetadataState.data[orgAbbrev]?.dataLoadTime;

    if (!orgAbbrev) {
      return rejectWithValue(`No orgAbbrev in state for org ${orgAbbrev}`);
    }

    const response = await getLatestActivityTime('Organisation', token!, orgAbbrev);
    if (response.status !== 'Success') {
      return rejectWithValue(response.error);
    }

    const isStale = !currentTimestamp || new Date(response.data!) > new Date(currentTimestamp);

    return { orgAbbrev, isStale };
  },
);

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
    const { orgAbbrev } = params;
    const state = getState() as RootState;
    const { token } = state.orgMetadataState;
    const fields = state.orgMetadataState.data[orgAbbrev].fields!.map((f) => f.columnName);
    const response = await getOrgMetadataByField(orgAbbrev, fields, token!);
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

const GROUP_POLL_INTERVAL_MS = 2 * 60 * 1000;

listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    const orgAbbrev = (action as any)?.meta?.arg?.orgAbbrev ?? (action as any)?.payload?.orgAbbrev;
    if (!orgAbbrev) return false;

    const prev = (previousState as RootState).orgMetadataState.data[orgAbbrev]?.loadingState;
    const curr = (currentState as RootState).orgMetadataState.data[orgAbbrev]?.loadingState;

    return prev !== MetadataLoadingState.DATA_LOADED && curr === MetadataLoadingState.DATA_LOADED;
  },
  effect: async (action, listenerApi) => {
    const orgAbbrev = (action as any)?.meta?.arg?.orgAbbrev ?? (action as any)?.payload?.orgAbbrev;

    while (true) {
      const cancelled = await Promise.race([
        listenerApi.delay(GROUP_POLL_INTERVAL_MS).then(() => false),
        listenerApi
          .take(
            (_a, currentState) =>
              (currentState as RootState).orgMetadataState.data[orgAbbrev]?.loadingState !==
              MetadataLoadingState.DATA_LOADED,
          )
          .then(() => true),
      ]);

      if (cancelled) break;

      const loadingState = (listenerApi.getState() as RootState).orgMetadataState.data[orgAbbrev]
        ?.loadingState;
      if (loadingState !== MetadataLoadingState.DATA_LOADED) break;

      listenerApi.dispatch(pollOrgStaleness({ orgAbbrev }));
    }
  },
});
// Launch fetchGroupFields when FETCH_REQUESTED is set (initial load, explicit reload request, or stale data check)
const FETCH_REQUESTED_ACTIONS = [
  'orgMetadata/fetchOrgMetadata',
  'orgMetadata/reloadOrgMetadata',
  getOrgLatestActivityTime.fulfilled.type,
];
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
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

// Launch data view fetch after group fields retrieved
listenerMiddleware.startListening({
  predicate: (action) => fetchOrgFields.fulfilled.match(action),
  effect: (action, listenerApi) => {
    const { orgAbbrev } = (action as any).meta.arg;
    listenerApi.dispatch(fetchDataView({ orgAbbrev }));
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
        state.data[orgAbbrev].loadingState === MetadataLoadingState.ERROR
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
      state.data[orgAbbrev].fieldUniqueValues = {};
      fields.forEach((field) => {
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
      const { orgAbbrev } = action.meta.arg;
      state.data[orgAbbrev].loadingState = MetadataLoadingState.AWAITING_DATA;
    });

    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { orgAbbrev } = action.meta.arg;
      const { data } = action.payload as FetchDataViewResponse;
      const fields = state.data[orgAbbrev].fields!;
      const fieldNames = fields.map((f) => f.columnName);

      if (fieldNames.includes(HAS_SEQUENCES)) {
        replaceHasSequencesNullsWithFalse(data);
      }
      replaceNullsWithEmpty(data);

      state.data[orgAbbrev].emptyColumns = getEmptyStringColumns(data, fieldNames);
      replaceDateStrings(data, fields, fieldNames);
      state.data[orgAbbrev].metadata = data;

      // Default sort by Date_updated, fallback to SEQID
      if (state.data[orgAbbrev].metadata!.length > 0) {
        const metadata = state.data[orgAbbrev].metadata!;
        const [firstRow] = metadata;

        if (firstRow[DATE_UPDATED]) {
          metadata.sort((a: Sample, b: Sample) =>
            compareDatesDesc(a[DATE_UPDATED], b[DATE_UPDATED]),
          );
        } else if (firstRow[DATE_CREATED]) {
          metadata.sort((a: Sample, b: Sample) =>
            compareDatesDesc(a[DATE_CREATED], b[DATE_CREATED]),
          );
        } else if (firstRow[SAMPLE_ID_FIELD]) {
          const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
          metadata.sort((a: Sample, b: Sample) =>
            collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]),
          );
        }
      }

      // Calculate unique values; would be better server-side but this is quite fast
      // Fields with defined valid values can just be looked up
      const categoricalFields = fields.filter(
        (field) => field.canVisualise && field.metaDataColumnValidValues,
      );
      categoricalFields.forEach((field) => {
        state.data[orgAbbrev].fieldUniqueValues![field.columnName] =
          field.metaDataColumnValidValues;
      });

      // Visualisable string field unique values must be calculated
      const visualisableFields = fields.filter(
        (field) => field.canVisualise && field.primitiveType === 'string',
      );
      const valueSets: Record<string, Set<string>> = {};
      visualisableFields.forEach((field) => {
        valueSets[field.columnName] = new Set();
      });
      data.forEach((sample) => {
        visualisableFields.forEach((field) => {
          const value = sample[field.columnName];
          valueSets[field.columnName].add(value === null ? 'null' : value);
        });
      });
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      visualisableFields.forEach((field) => {
        state.data[orgAbbrev].fieldUniqueValues![field.columnName] = Array.from(
          valueSets[field.columnName],
        ).sort(collator.compare);
      });

      state.data[orgAbbrev].dataLoadTime = new Date().toISOString();
      state.data[orgAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
    });

    builder.addCase(fetchDataView.rejected, (state, action) => {
      const { orgAbbrev } = action.meta.arg;
      state.data[orgAbbrev].loadingState = MetadataLoadingState.ERROR;
      state.data[orgAbbrev].errorMessage = `Unable to load metadata: ${action.payload}`;
    });

    builder.addCase(pollOrgStaleness.fulfilled, (state, action) => {
      const { orgAbbrev, isStale } = action.payload as PollOrgStalenessResponse;
      if (isStale) {
        state.data[orgAbbrev].isDataStale = true;
      }
    });
    builder.addCase(pollOrgStaleness.rejected, (_, action) => {
      //biome-ignore lint/suspicious/noConsole: interim error logging
      console.error(
        `Staleness poll failed for org ${action.meta.arg.orgAbbrev}: ${action.payload}`,
      );
    });
  },
});

// reducer
export default orgMetadataSlice.reducer;

// actions only. Thunks are for internal state machine use
export const { fetchOrgMetadata, reloadOrgMetadata } = orgMetadataSlice.actions;

// selectors

export const selectOrgMetadata: (
  state: RootState,
  orgAbbrev: string | undefined,
) => OrgMetadataState | null = (state, orgAbbrev) => {
  if (!orgAbbrev) return null;
  return state.orgMetadataState.data[orgAbbrev] ?? null;
};

export const selectOrgStaleDataAvailable = (state: RootState, orgAbbrev: string | undefined) => {
  if (!orgAbbrev) return false;
  return state.orgMetadataState.data[orgAbbrev]?.isDataStale ?? false;
};

export const selectOrgMetadataFields = (state: RootState, orgAbbrev: string | undefined) => {
  if (!orgAbbrev) {
    return { fields: null, fieldUniqueValues: null, loadingState: MetadataLoadingState.IDLE };
  }
  return {
    fields: state.orgMetadataState.data[orgAbbrev]?.fields,
    fieldUniqueValues: state.orgMetadataState.data[orgAbbrev]?.fieldUniqueValues,
    loadingState: state.orgMetadataState.data[orgAbbrev]?.loadingState,
  };
};

export const selectOrgMetadataError = (state: RootState, orgAbbrev: string | undefined) => {
  if (!orgAbbrev) return null;
  return state.orgMetadataState.data[orgAbbrev]?.errorMessage;
};

export const selectAwaitingOrgMetadata = (state: RootState, orgAbbrev: string | undefined) => {
  if (!orgAbbrev) return true;
  const loadingState = state.orgMetadataState.data[orgAbbrev]?.loadingState;
  if (!loadingState) return true;
  return (
    loadingState === MetadataLoadingState.IDLE ||
    loadingState === MetadataLoadingState.FETCH_REQUESTED ||
    loadingState === MetadataLoadingState.AWAITING_FIELDS ||
    loadingState === MetadataLoadingState.FIELDS_LOADED ||
    loadingState === MetadataLoadingState.AWAITING_DATA
  );
};
