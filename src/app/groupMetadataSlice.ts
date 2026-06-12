import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { HAS_SEQUENCES, SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import MetadataLoadingState from '../constants/metadataLoadingState';
import type { MetaDataColumn } from '../types/dtos';
import type { Sample } from '../types/sample.interface';
import { getDisplayFields, getLatestActivityTime, getMetadata } from '../utilities/resourceUtils';
import { listenerMiddleware } from './listenerMiddleware';
import {
  getEmptyStringColumns,
  replaceDateStrings,
  replaceHasSequencesNullsWithFalse,
  replaceNullsWithEmpty,
} from './metadataSliceUtils';
import type { RootState } from './store';

// Note that this state includes orgAbbrev, which must be supplied as a param,
// implying that groupMetadataSlice is only used for org data. This is currently the case.
// If this were not the case we'd have to make orgAbbrev optional and skip the update checks when null.

export interface GroupMetadataState {
  groupId: number | null;
  orgAbbrev: string | null;
  dataLoadTime: string | null;
  loadingState: MetadataLoadingState;
  fields: MetaDataColumn[] | null;
  fieldUniqueValues: Record<string, string[] | null> | null;
  metadata: Sample[] | null;
  emptyColumns: string[];
  errorMessage: string | null;
}

const groupMetadataInitialStateCreator = (groupId: number): GroupMetadataState => ({
  groupId,
  orgAbbrev: null,
  dataLoadTime: null,
  loadingState: MetadataLoadingState.IDLE,
  fields: null,
  fieldUniqueValues: null,
  metadata: null,
  emptyColumns: [],
  errorMessage: null,
});

interface GroupMetadataSliceState {
  data: { [groupId: number]: GroupMetadataState };
  token: string | null; // must be provided by calling component along with each fetch request
}

const initialState: GroupMetadataSliceState = {
  data: {},
  token: null,
};

// Input parameters and return types (on success/fulfilled) for actions and thunks

interface FetchGroupMetadataParams {
  groupId: number;
  token: string;
  orgAbbrev: string;
}

interface FetchGroupFieldsParams {
  groupId: number;
}

interface FetchGroupFieldsResponse {
  fields: MetaDataColumn[];
}

interface FetchDataViewParams {
  groupId: number;
}

interface FetchDataViewResponse {
  data: Sample[];
}

interface FetchLatestActivityTimeParams {
  groupId: number;
  orgAbbrev: string; // could get from state, but would like to track in params
}

interface FetchLatestActivityTimeResponse {
  timestamp: string;
}

const getGroupLatestActivityTime = createAsyncThunk(
  'groupMetadata/getGroupLatestActivityTime',
  async (
    params: FetchLatestActivityTimeParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchLatestActivityTimeResponse | unknown> => {
    const { orgAbbrev } = params;
    const { token } = (getState() as RootState).groupMetadataState;
    const response = await getLatestActivityTime('Organisation', token!, orgAbbrev!);
    if (response.status !== 'Success') {
      return rejectWithValue(response.error);
    }
    return fulfillWithValue<FetchLatestActivityTimeResponse>({ timestamp: response.data! });
  },
);

const fetchGroupFields = createAsyncThunk(
  'groupMetadata/fetchGroupFields',
  async (
    params: FetchGroupFieldsParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchGroupFieldsResponse | unknown> => {
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
  ): Promise<FetchDataViewResponse | unknown> => {
    const { groupId } = params;
    const state = getState() as RootState;
    const { token } = state.groupMetadataState;
    const fields = state.groupMetadataState.data[groupId].fields!.map((f) => f.columnName);
    const response = await getMetadata(groupId, fields, token!);
    if (response.status === 'Success') {
      return fulfillWithValue<FetchDataViewResponse>({
        data: response.data as Sample[],
      });
    }
    return rejectWithValue(response.error);
  },
);

// These listeners launch thunks in response to state changes or actions
// The state update triggered by the listener will be the thunk's pending action

// Launch getGroupLatestActivityTime in response to CHECK_FOR_UPDATE state
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    if (action.type !== 'groupMetadata/fetchGroupMetadata') return false;
    const previousLoadingState = (previousState as RootState).groupMetadataState.data[
      (action as any).payload.groupId
    ]?.loadingState;
    const loadingState = (currentState as RootState).groupMetadataState.data[
      (action as any).payload.groupId
    ]?.loadingState;
    return (
      previousLoadingState !== MetadataLoadingState.CHECK_FOR_UPDATE &&
      loadingState === MetadataLoadingState.CHECK_FOR_UPDATE
    );
  },
  effect: (action, listenerApi) => {
    listenerApi.dispatch(
      getGroupLatestActivityTime({
        groupId: (action as any).payload.groupId,
        orgAbbrev: (action as any).payload.orgAbbrev,
      }),
    );
  },
});

// Launch fetchGroupFields when FETCH_REQUESTED is set (initial load, explicit reload request, or stale data check)
const FETCH_REQUESTED_ACTIONS = [
  'groupMetadata/fetchGroupMetadata',
  'groupMetadata/reloadGroupMetadata',
  getGroupLatestActivityTime.fulfilled.type,
];
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    if (!FETCH_REQUESTED_ACTIONS.includes(action.type)) return false;
    const groupId = (action as any)?.payload?.groupId ?? (action as any)?.meta?.arg?.groupId;
    if (!groupId) return false;
    // biome-ignore format: readability
    const previousLoadingState =
      (previousState as RootState).groupMetadataState.data[groupId]?.loadingState;
    const loadingState = (currentState as RootState).groupMetadataState.data[groupId]?.loadingState;
    return (
      previousLoadingState !== MetadataLoadingState.FETCH_REQUESTED &&
      loadingState === MetadataLoadingState.FETCH_REQUESTED
    );
  },
  effect: (action, listenerApi) => {
    const groupId = (action as any)?.payload?.groupId ?? (action as any)?.meta?.arg?.groupId;
    listenerApi.dispatch(fetchGroupFields({ groupId }));
  },
});

// Launch data view fetch after group fields retrieved
listenerMiddleware.startListening({
  predicate: (action) => fetchGroupFields.fulfilled.match(action),
  effect: (action, listenerApi) => {
    const { groupId } = (action as any).meta.arg;
    listenerApi.dispatch(fetchDataView({ groupId }));
  },
});

export const groupMetadataSlice = createSlice({
  name: 'groupMetadata',
  initialState,
  reducers: {
    fetchGroupMetadata: (state, action: PayloadAction<FetchGroupMetadataParams>) => {
      const { groupId, token, orgAbbrev } = action.payload;
      if (!state.data[groupId]) {
        state.data[groupId] = groupMetadataInitialStateCreator(groupId);
      }
      // If data is not loaded, initialise fetch
      // If data is loaded, dispatch call to check timestamp for data updates
      // If we are in any other state (i.e. partway through load), do nothing, allow the load process to complete
      if (
        state.data[groupId].loadingState === MetadataLoadingState.IDLE ||
        state.data[groupId].loadingState === MetadataLoadingState.ERROR
      ) {
        if (state.data[groupId].loadingState !== MetadataLoadingState.IDLE) {
          state.data[groupId] = groupMetadataInitialStateCreator(groupId);
        }
        state.data[groupId].loadingState = MetadataLoadingState.FETCH_REQUESTED;
        state.token = token;
        state.data[groupId].orgAbbrev = orgAbbrev;
      } else if (state.data[groupId].loadingState === MetadataLoadingState.DATA_LOADED) {
        state.data[groupId].loadingState = MetadataLoadingState.CHECK_FOR_UPDATE;
        state.token = token;
        state.data[groupId].orgAbbrev = orgAbbrev;
      }
    },
    reloadGroupMetadata: (state, action: PayloadAction<FetchGroupMetadataParams>) => {
      const { groupId, token, orgAbbrev } = action.payload;
      state.data[groupId] = groupMetadataInitialStateCreator(groupId);
      state.data[groupId].loadingState = MetadataLoadingState.FETCH_REQUESTED;
      state.token = token;
      state.data[groupId].orgAbbrev = orgAbbrev;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getGroupLatestActivityTime.fulfilled, (state, action) => {
      const { groupId } = action.meta.arg;
      const { timestamp } = action.payload as FetchLatestActivityTimeResponse;
      const currentTimestamp = state.data[groupId]?.dataLoadTime;
      if (!currentTimestamp || new Date(timestamp) > new Date(currentTimestamp)) {
        state.data[groupId].loadingState = MetadataLoadingState.FETCH_REQUESTED;
      } else {
        state.data[groupId].loadingState = MetadataLoadingState.DATA_LOADED;
      }
    });

    builder.addCase(getGroupLatestActivityTime.rejected, (state, action) => {
      const { groupId, orgAbbrev } = action.meta.arg;
      state.data[groupId].loadingState = MetadataLoadingState.DATA_LOADED;
      //biome-ignore lint/suspicious/noConsole: interim error logging
      console.error(
        `Failed to check for data updates in group ${groupId}, organisation ${orgAbbrev}: ${action.payload}`,
      );
    });

    builder.addCase(fetchGroupFields.pending, (state, action) => {
      const { groupId } = action.meta.arg;
      state.data[groupId] = groupMetadataInitialStateCreator(groupId);
      state.data[groupId].loadingState = MetadataLoadingState.AWAITING_FIELDS;
    });

    builder.addCase(fetchGroupFields.fulfilled, (state, action) => {
      const { groupId } = action.meta.arg;
      const { fields } = action.payload as FetchGroupFieldsResponse;
      fields.sort((a, b) => a.columnOrder - b.columnOrder);
      state.data[groupId].fields = fields;
      state.data[groupId].fieldUniqueValues = {};
      fields.forEach((field) => {
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
      const { groupId } = action.meta.arg;
      state.data[groupId].loadingState = MetadataLoadingState.AWAITING_DATA;
    });

    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { groupId } = action.meta.arg;
      const { data } = action.payload as FetchDataViewResponse;
      const fields = state.data[groupId].fields!;
      const fieldNames = fields.map((f) => f.columnName);

      if (fieldNames.includes(HAS_SEQUENCES)) {
        replaceHasSequencesNullsWithFalse(data);
      }
      replaceNullsWithEmpty(data);

      state.data[groupId].emptyColumns = getEmptyStringColumns(data, fieldNames);
      replaceDateStrings(data, fields, fieldNames);
      state.data[groupId].metadata = data;

      // Default sort by Seq_ID; could be done server-side
      if (
        state.data[groupId].metadata!.length > 0 &&
        state.data[groupId].metadata![0][SAMPLE_ID_FIELD]
      ) {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        state.data[groupId].metadata!.sort((a, b) =>
          collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]),
        );
      }

      // Calculate unique values; would be better server-side but this is quite fast
      // Fields with defined valid values can just be looked up
      const categoricalFields = fields.filter(
        (field) => field.canVisualise && field.metaDataColumnValidValues,
      );
      categoricalFields.forEach((field) => {
        state.data[groupId].fieldUniqueValues![field.columnName] = field.metaDataColumnValidValues;
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
        state.data[groupId].fieldUniqueValues![field.columnName] = Array.from(
          valueSets[field.columnName],
        ).sort(collator.compare);
      });

      state.data[groupId].dataLoadTime = new Date().toISOString();
      state.data[groupId].loadingState = MetadataLoadingState.DATA_LOADED;
    });

    builder.addCase(fetchDataView.rejected, (state, action) => {
      const { groupId } = action.meta.arg;
      state.data[groupId].loadingState = MetadataLoadingState.ERROR;
      state.data[groupId].errorMessage = `Unable to load metadata: ${action.payload}`;
    });
  },
});

// reducer
export default groupMetadataSlice.reducer;

// actions only. Thunks are for internal state machine use
export const { fetchGroupMetadata, reloadGroupMetadata } = groupMetadataSlice.actions;

// selectors

export const selectGroupMetadata: (
  state: RootState,
  groupId: number | undefined,
) => GroupMetadataState | null = (state, groupId) => {
  if (!groupId) return null;
  return state.groupMetadataState.data[groupId] ?? null;
};

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

export const selectAwaitingGroupMetadata = (state: RootState, groupId: number | undefined) => {
  if (!groupId) return true;
  const loadingState = state.groupMetadataState.data[groupId]?.loadingState;
  if (!loadingState) return true;
  return (
    loadingState === MetadataLoadingState.IDLE ||
    loadingState === MetadataLoadingState.FETCH_REQUESTED ||
    loadingState === MetadataLoadingState.AWAITING_FIELDS ||
    loadingState === MetadataLoadingState.FIELDS_LOADED ||
    loadingState === MetadataLoadingState.AWAITING_DATA
  );
};
