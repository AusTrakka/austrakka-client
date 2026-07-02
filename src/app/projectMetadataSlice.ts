import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MapSupportInfo } from '../components/Maps/mapMeta';
import { MergeAlgorithm } from '../constants/mergeAlgorithm';
import { HAS_SEQUENCES, SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import MetadataLoadingState from '../constants/metadataLoadingState';
import type { ProjectField, ProjectView, ProjectViewField } from '../types/dtos';
import type { Sample } from '../types/sample.interface';
import {
  getLatestActivityTime,
  getProjectDetails,
  getProjectFields,
  getProjectView,
  getProjectViewData,
} from '../utilities/resourceUtils';
import { listenerMiddleware } from './listenerMiddleware';
import {
  calculateSupportedMaps,
  calculateUniqueValues,
  calculateViewFieldNames,
  getEmptyStringColumns,
  insertUnpopulatedOverrideFields,
  normaliseHasSequencesTrueBoolWithString,
  replaceDateStrings,
  replaceHasSequencesNullsWithFalse,
  replaceNullsWithEmpty,
} from './metadataSliceUtils';
import type { RootState } from './store';

export interface ProjectMetadataState {
  projectAbbrev: string | null;
  dataLoadTime: string | null;
  mergeAlgorithm: string | null;
  supportedMaps: MapSupportInfo[];
  loadingState: MetadataLoadingState;
  projectFields: ProjectField[] | null;
  // TODO: With a single complete view, ProjectViewField may be redundant with ProjectField.
  // columnName is likely always identical to fieldName. Might need to collapse.
  fields: ProjectViewField[] | null;
  fieldUniqueValues: Record<string, string[] | null> | null;
  view: ProjectView | null;
  metadata: Sample[] | null;
  emptyColumns: string[];
  errorMessage: string | null;
  isDataStale: boolean;
}

const projectMetadataInitialStateCreator = (projectAbbrev: string): ProjectMetadataState => ({
  projectAbbrev,
  dataLoadTime: null,
  mergeAlgorithm: null,
  supportedMaps: [],
  loadingState: MetadataLoadingState.IDLE,
  projectFields: null,
  fields: null,
  fieldUniqueValues: null,
  view: null,
  metadata: null,
  emptyColumns: [],
  errorMessage: null,
  isDataStale: false,
});

interface ProjectMetadataSliceState {
  data: { [projectAbbrev: string]: ProjectMetadataState };
  token: string | null; // must be provided by calling component along with each fetch request
}

const initialState: ProjectMetadataSliceState = {
  data: {},
  token: null,
};

// Input parameters and return types (on success/fulfilled) for actions and thunks
interface FetchProjectMetadataParams {
  projectAbbrev: string;
  token: string;
}

interface FetchProjectInfoParams {
  projectAbbrev: string;
}

interface FetchProjectInfoResponse {
  mergeAlgorithm: string;
  fields: ProjectField[];
  view: ProjectView;
}

interface FetchDataViewParams {
  projectAbbrev: string;
}

interface FetchDataViewResponse {
  data: Sample[];
}

interface FetchLatestActivityTimeParams {
  projectAbbrev: string;
}

interface FetchLatestActivityTimeResponse {
  timestamp: string;
}

interface PollProjectStalenessResponse {
  projectAbbrev: string;
  isStale: boolean;
}

const getProjectLatestActivityTime = createAsyncThunk(
  'projectMetadata/getProjectLatestActivityTime',
  async (
    params: FetchLatestActivityTimeParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchLatestActivityTimeResponse | unknown> => {
    const { projectAbbrev } = params;
    const { token } = (getState() as RootState).projectMetadataState;

    const response = await getLatestActivityTime('Project', token!, projectAbbrev);
    if (response.status !== 'Success') {
      return rejectWithValue(response.error);
    }

    return fulfillWithValue<FetchLatestActivityTimeResponse>({ timestamp: response.data! });
  },
);

// Fetch project fields and views
const fetchProjectInfo = createAsyncThunk(
  'projectMetadata/fetchProjectInfo',
  async (
    params: FetchProjectInfoParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchProjectInfoResponse | unknown> => {
    const { projectAbbrev } = params;
    const { token } = (getState() as RootState).projectMetadataState;

    const fieldsResponse = await getProjectFields(projectAbbrev, token!);
    if (fieldsResponse.status !== 'Success') {
      return rejectWithValue(fieldsResponse.error);
    }

    const viewsResponse = await getProjectView(projectAbbrev, token!);
    if (viewsResponse.status !== 'Success') {
      return rejectWithValue(viewsResponse.error);
    }
    if (!viewsResponse.data) {
      return rejectWithValue(`No project views found for ${projectAbbrev}`);
    }

    const projectSettingsResponse = await getProjectDetails(projectAbbrev, token!);
    if (projectSettingsResponse.status !== 'Success') {
      return rejectWithValue(projectSettingsResponse.error);
    }

    return fulfillWithValue<FetchProjectInfoResponse>({
      mergeAlgorithm: projectSettingsResponse.data!.mergeAlgorithm,
      fields: fieldsResponse.data as ProjectField[],
      view: viewsResponse.data,
    });
  },
);

const fetchDataView = createAsyncThunk(
  'projectMetadata/fetchDataView',
  async (
    params: FetchDataViewParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchDataViewResponse | unknown> => {
    const { projectAbbrev } = params;
    const state = getState() as RootState;
    const { token } = state.projectMetadataState;
    const response = await getProjectViewData(projectAbbrev, token!);
    if (response.ok) {
      try {
        const data: Sample[] = await response.json();
        return fulfillWithValue<FetchDataViewResponse>({ data });
      } catch (_e) {
        return rejectWithValue('An error occurred parsing project metadata');
      }
    }
    return rejectWithValue('An error occurred fetching project metadata');
  },
);

// NEW: Polling thunk — runs on a timer while the user is on-page in DATA_LOADED.
// Intentionally does not touch loadingState; only sets staleDataAvailable.
// Failures are silent (logged only) so polling errors don't disrupt the UI.
const pollProjectStaleness = createAsyncThunk(
  'projectMetadata/pollProjectStaleness',
  async (
    params: { projectAbbrev: string },
    { rejectWithValue, getState },
  ): Promise<PollProjectStalenessResponse | unknown> => {
    const { projectAbbrev } = params;
    const state = getState() as RootState;
    const { token } = state.projectMetadataState;
    const currentTimestamp = state.projectMetadataState.data[projectAbbrev]?.dataLoadTime;

    const response = await getLatestActivityTime('Project', token!, projectAbbrev);
    if (response.status !== 'Success') {
      return rejectWithValue(response.error);
    }

    const isStale = !currentTimestamp || new Date(response.data!) > new Date(currentTimestamp);
    return { projectAbbrev, isStale };
  },
);

// Launch getProjectLatestActivityTime in response to CHECK_FOR_UPDATE state
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    if (action.type !== 'projectMetadata/fetchProjectMetadata') return false;
    const { projectAbbrev } = (action as any).payload;
    // biome-ignore format: readability
    const previousLoadingState =
      (previousState as RootState).projectMetadataState.data[projectAbbrev]?.loadingState;
    // biome-ignore format: readability
    const loadingState =
      (currentState as RootState).projectMetadataState.data[projectAbbrev]?.loadingState;
    return (
      previousLoadingState !== MetadataLoadingState.CHECK_FOR_UPDATE &&
      loadingState === MetadataLoadingState.CHECK_FOR_UPDATE
    );
  },
  effect: (action, listenerApi) => {
    listenerApi.dispatch(
      getProjectLatestActivityTime({ projectAbbrev: (action as any).payload.projectAbbrev }),
    );
  },
});

// Launch fetchProjectFields when FETCH_REQUESTED is set (fetch requested or stale data check)
const FETCH_REQUESTED_ACTIONS = [
  'projectMetadata/fetchProjectMetadata',
  getProjectLatestActivityTime.fulfilled.type,
];
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't spend time reading state
    if (!FETCH_REQUESTED_ACTIONS.includes(action.type)) return false;
    const projectAbbrev =
      (action as any)?.payload?.projectAbbrev ?? (action as any)?.meta?.arg?.projectAbbrev;
    if (!projectAbbrev) return false;
    // Check that the reducer logic is telling us to trigger a new load process
    // biome-ignore format: readability
    const previousLoadingState =
      (previousState as RootState).projectMetadataState.data[projectAbbrev]?.loadingState;
    // biome-ignore format: readability
    const loadingState =
      (currentState as RootState).projectMetadataState.data[projectAbbrev]?.loadingState;
    return (
      previousLoadingState !== MetadataLoadingState.FETCH_REQUESTED &&
      loadingState === MetadataLoadingState.FETCH_REQUESTED
    );
  },
  effect: (action, listenerApi) => {
    const projectAbbrev =
      (action as any)?.payload?.projectAbbrev ?? (action as any)?.meta?.arg?.projectAbbrev;
    listenerApi.dispatch(fetchProjectInfo({ projectAbbrev }));
  },
});

// Launch data view fetch after project info retrieved
listenerMiddleware.startListening({
  predicate: (action) => fetchProjectInfo.fulfilled.match(action),
  effect: (action, listenerApi) => {
    const { projectAbbrev } = (action as any).meta.arg;
    listenerApi.dispatch(fetchDataView({ projectAbbrev }));
  },
});

//INFO: Polling listener.
// Starts when any project enters DATA_LOADED. Dispatches pollProjectStaleness every poll interval.
// Cancels automatically when loadingState leaves DATA_LOADED for any reason
// (user triggers reload via banner, navigation triggers CHECK_FOR_UPDATE).
const POLL_INTERVAL_MS = 2 * 60 * 1000;

listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    const projectAbbrev =
      (action as any)?.meta?.arg?.projectAbbrev ?? (action as any)?.payload?.projectAbbrev;
    if (!projectAbbrev) return false;

    const prev = (previousState as RootState).projectMetadataState.data[projectAbbrev]
      ?.loadingState;
    const curr = (currentState as RootState).projectMetadataState.data[projectAbbrev]?.loadingState;

    return prev !== MetadataLoadingState.DATA_LOADED && curr === MetadataLoadingState.DATA_LOADED;
  },
  effect: async (action, listenerApi) => {
    const projectAbbrev =
      (action as any)?.meta?.arg?.projectAbbrev ?? (action as any)?.payload?.projectAbbrev;

    while (true) {
      // Race the interval delay against a state change that means we should stop.
      // listenerApi.take resolves when the predicate returns true — we use it as
      // a cancellation signal by throwing, which breaks the while loop via the catch.
      const cancelled = await Promise.race([
        listenerApi.delay(POLL_INTERVAL_MS).then(() => false),
        listenerApi
          .take(
            (_a, currentState) =>
              (currentState as RootState).projectMetadataState.data[projectAbbrev]?.loadingState !==
              MetadataLoadingState.DATA_LOADED,
          )
          .then(() => true),
      ]);

      if (cancelled) break;

      // Defensive re-check in case state changed between the race resolving and here
      const loadingState = (listenerApi.getState() as RootState).projectMetadataState.data[
        projectAbbrev
      ]?.loadingState;
      if (loadingState !== MetadataLoadingState.DATA_LOADED) break;

      listenerApi.dispatch(pollProjectStaleness({ projectAbbrev }));
    }
  },
});
export const projectMetadataSlice = createSlice({
  name: 'projectMetadata',
  initialState,
  reducers: {
    fetchProjectMetadata: (state, action: PayloadAction<FetchProjectMetadataParams>) => {
      const { projectAbbrev, token } = action.payload;
      if (!state.data[projectAbbrev]) {
        // Set initial state for this group
        state.data[projectAbbrev] = projectMetadataInitialStateCreator(projectAbbrev);
      }
      // If data is not loaded, initialise fetch
      // If data is loaded, dispatch call to check timestamp for data updates
      // If we are in any other state (i.e. partway through load), do nothing, allow the load process to complete
      if (
        state.data[projectAbbrev].loadingState === MetadataLoadingState.IDLE ||
        state.data[projectAbbrev].loadingState === MetadataLoadingState.ERROR
      ) {
        // If we are refreshing from error state, clear data in the meantime
        if (state.data[projectAbbrev].loadingState !== MetadataLoadingState.IDLE) {
          state.data[projectAbbrev] = projectMetadataInitialStateCreator(projectAbbrev);
        }
        state.data[projectAbbrev].loadingState = MetadataLoadingState.FETCH_REQUESTED;
        state.token = token;
      } else if (state.data[projectAbbrev].loadingState === MetadataLoadingState.DATA_LOADED) {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.CHECK_FOR_UPDATE;
        state.token = token;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getProjectLatestActivityTime.fulfilled, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      const { timestamp } = action.payload as FetchLatestActivityTimeResponse;
      const currentTimestamp = state.data[projectAbbrev]?.dataLoadTime;
      // If there is no stored timestamp, or the retrieved timestamp is newer, trigger a full reload
      if (!currentTimestamp || new Date(timestamp) > new Date(currentTimestamp)) {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.FETCH_REQUESTED;
      } else {
        // Data is up to date; return to loaded state
        state.data[projectAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
      }
    });
    builder.addCase(getProjectLatestActivityTime.rejected, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      state.data[projectAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
      //biome-ignore lint/suspicious/noConsole: interim error logging
      console.error(`Failed to check for data updates in ${projectAbbrev}: ${action.payload}`);
    });

    builder.addCase(fetchProjectInfo.pending, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      state.data[projectAbbrev] = projectMetadataInitialStateCreator(projectAbbrev);
      state.data[projectAbbrev].loadingState = MetadataLoadingState.AWAITING_FIELDS;
    });

    builder.addCase(fetchProjectInfo.fulfilled, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      const { mergeAlgorithm, fields, view } = action.payload as FetchProjectInfoResponse;

      state.data[projectAbbrev].mergeAlgorithm = mergeAlgorithm;

      fields.sort((a, b) => {
        if (a.columnOrder !== b.columnOrder) {
          return a.columnOrder - b.columnOrder;
        }
        return a.fieldName.localeCompare(b.fieldName, undefined, { sensitivity: 'base' });
      });
      state.data[projectAbbrev].projectFields = fields;

      const viewFieldMap: Record<string, string[]> = {};
      fields.forEach((field) => {
        viewFieldMap[field.fieldName] = calculateViewFieldNames(
          field,
          state.data[projectAbbrev].mergeAlgorithm!,
        );
      });

      state.data[projectAbbrev].fields = [];
      fields.forEach((projField: ProjectField) => {
        viewFieldMap[projField.fieldName].forEach((columnName: string) => {
          state.data[projectAbbrev].fields!.push({
            ...projField,
            projectFieldName: projField.fieldName,
            columnName,
          });
        });
      });

      view.viewFields = view.fields.flatMap((field) => viewFieldMap[field]);
      state.data[projectAbbrev].view = view;
      state.data[projectAbbrev].fieldUniqueValues = {};
      state.data[projectAbbrev].fields!.forEach((field) => {
        state.data[projectAbbrev].fieldUniqueValues![field.columnName!] = null;
      });

      state.data[projectAbbrev].loadingState = MetadataLoadingState.FIELDS_LOADED;
    });

    builder.addCase(fetchProjectInfo.rejected, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      state.data[projectAbbrev].errorMessage = `Unable to load project fields: ${action.payload}`;
      state.data[projectAbbrev].loadingState = MetadataLoadingState.ERROR;
    });

    builder.addCase(fetchDataView.pending, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      state.data[projectAbbrev].loadingState = MetadataLoadingState.AWAITING_DATA;
    });

    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      const { data } = action.payload as FetchDataViewResponse;
      const { viewFields } = state.data[projectAbbrev].view!;

      if (viewFields.includes(HAS_SEQUENCES)) {
        replaceHasSequencesNullsWithFalse(data);
        normaliseHasSequencesTrueBoolWithString(data);
      }
      replaceNullsWithEmpty(data);

      if (state.data[projectAbbrev].mergeAlgorithm === MergeAlgorithm.OVERRIDE) {
        insertUnpopulatedOverrideFields(data, state.data[projectAbbrev].projectFields!, viewFields);
      }

      state.data[projectAbbrev].emptyColumns = getEmptyStringColumns(data, viewFields);
      replaceDateStrings(data, state.data[projectAbbrev].fields!, viewFields);
      state.data[projectAbbrev].metadata = data;

      // Default sort by Seq_ID; could be done server-side
      if (
        state.data[projectAbbrev].metadata!.length > 0 &&
        state.data[projectAbbrev].metadata![0][SAMPLE_ID_FIELD]
      ) {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        state.data[projectAbbrev].metadata!.sort((a, b) =>
          collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]),
        );
      }

      // Calculate unique values; would be better server-side but this is quite fast
      const uniqueVals = calculateUniqueValues(viewFields, state.data[projectAbbrev].fields!, data);

      const geoFields = state.data[projectAbbrev]
        .fields!.filter((field) => field.geoField)
        .map((field) => field.columnName!);
      state.data[projectAbbrev].supportedMaps = calculateSupportedMaps(uniqueVals, geoFields);

      viewFields.forEach((field) => {
        state.data[projectAbbrev].fieldUniqueValues![field] = uniqueVals[field];
      });

      state.data[projectAbbrev].dataLoadTime = new Date().toISOString();
      state.data[projectAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
    });

    builder.addCase(fetchDataView.rejected, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      state.data[projectAbbrev].loadingState = MetadataLoadingState.ERROR;
      state.data[projectAbbrev].errorMessage = `Unable to load project data: ${action.payload}`;
    });

    // NEW: Polling reducers — only touch staleDataAvailable, nothing else
    builder.addCase(pollProjectStaleness.fulfilled, (state, action) => {
      const { projectAbbrev, isStale } = action.payload as PollProjectStalenessResponse;
      if (isStale) {
        state.data[projectAbbrev].isDataStale = true;
      }
    });
    builder.addCase(pollProjectStaleness.rejected, (_, action) => {
      // Silent fail — poll errors don't surface to the user
      //biome-ignore lint/suspicious/noConsole: interim error logging
      console.error(
        `Staleness poll failed for ${action.meta.arg.projectAbbrev}: ${action.payload}`,
      );
    });
  },
});

// reducer
export default projectMetadataSlice.reducer;

// actions only. Thunks are for internal state machine use
export const { fetchProjectMetadata } = projectMetadataSlice.actions;

// selectors
export const selectProjectMetadata: (
  state: RootState,
  projectAbbrev: string | null | undefined,
) => ProjectMetadataState | null = (state, projectAbbrev) => {
  if (!projectAbbrev) return null;
  return state.projectMetadataState.data[projectAbbrev!] ?? null;
};

// May want to also include a per-field loading state in this selector
export const selectProjectMetadataFields = (
  state: RootState,
  projectAbbrev: string | undefined,
) => {
  if (!projectAbbrev) {
    return { fields: null, fieldUniqueValues: null, loadingState: MetadataLoadingState.IDLE };
  }
  return {
    fields: state.projectMetadataState.data[projectAbbrev]?.fields,
    fieldUniqueValues: state.projectMetadataState.data[projectAbbrev]?.fieldUniqueValues,
    loadingState: state.projectMetadataState.data[projectAbbrev]?.loadingState,
  };
};

export const selectProjectMetadataError = (state: RootState, projectAbbrev: string | undefined) => {
  if (!projectAbbrev) return null;
  return state.projectMetadataState.data[projectAbbrev]?.errorMessage;
};

export const selectProjectMergeAlgorithm = (
  state: RootState,
  projectAbbrev: string | undefined,
) => {
  if (!projectAbbrev) return null;
  return state.projectMetadataState.data[projectAbbrev]?.mergeAlgorithm;
};

export const selectProjectStaleDataAvailable = (
  state: RootState,
  projectAbbrev: string | undefined,
) => {
  if (!projectAbbrev) return false;
  return state.projectMetadataState.data[projectAbbrev]?.isDataStale ?? false;
};
