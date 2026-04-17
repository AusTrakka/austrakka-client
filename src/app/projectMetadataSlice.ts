import { createAsyncThunk, createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import type { MapSupportInfo } from '../components/Maps/mapMeta';
import LoadingState from '../constants/loadingState';
import { HAS_SEQUENCES, SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import MetadataLoadingState from '../constants/metadataLoadingState';
import type { ProjectField, ProjectView, ProjectViewField } from '../types/dtos';
import type { Sample } from '../types/sample.interface';
import {
  getLatestActivityTime,
  getProjectDetails,
  getProjectFields,
  getProjectViewData,
  getProjectViews,
} from '../utilities/resourceUtils';
import { listenerMiddleware } from './listenerMiddleware';
import {
  calculateSupportedMaps,
  calculateUniqueValues,
  calculateViewFieldNames,
  getEmptyStringColumns,
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
  fields: ProjectViewField[] | null;
  fieldUniqueValues: Record<string, string[] | null> | null;
  views: Record<number, ProjectView>;
  viewLoadingStates: Record<number, LoadingState>;
  viewToFetch: number;
  metadata: Sample[] | null;
  emptyColumns: string[];
  fieldLoadingStates: Record<string, LoadingState>;
  errorMessage: string | null;
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
  views: {},
  viewLoadingStates: {},
  viewToFetch: 0,
  metadata: null,
  emptyColumns: [],
  fieldLoadingStates: {},
  errorMessage: null,
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
  views: ProjectView[];
}

interface FetchDataViewParams {
  projectAbbrev: string;
  viewIndex: number; // this is the lookup index, not the viewId
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
    const viewsResponse = await getProjectViews(projectAbbrev, token!);
    if (viewsResponse.status !== 'Success') {
      return rejectWithValue(viewsResponse.error);
    }
    const projectSettingsResponse = await getProjectDetails(projectAbbrev, token!);
    if (projectSettingsResponse.status !== 'Success') {
      return rejectWithValue(projectSettingsResponse.error);
    }
    return fulfillWithValue<FetchProjectInfoResponse>({
      mergeAlgorithm: projectSettingsResponse.data!.mergeAlgorithm,
      fields: fieldsResponse.data as ProjectField[],
      views: viewsResponse.data as ProjectView[],
    });
  },
);

const fetchDataView = createAsyncThunk(
  'projectMetadata/fetchDataView',
  async (
    params: FetchDataViewParams,
    { rejectWithValue, fulfillWithValue, getState },
  ): Promise<FetchDataViewResponse | unknown> => {
    const { projectAbbrev, viewIndex } = params;
    const state = getState() as RootState;
    const { token } = state.projectMetadataState;
    const view = state.projectMetadataState.data[projectAbbrev].views[viewIndex];

    const response = await getProjectViewData(projectAbbrev, view.id, token!);
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

// These listeners launch thunks in response to state changes or actions
// The state update triggered by the listener will be the thunk's pending action

// Launch getProjectLatestActivityTime in response to CHECK_FOR_UPDATE state
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    if (action.type !== 'projectMetadata/fetchProjectMetadata') return false;
    const previousLoadingState = (previousState as RootState).projectMetadataState.data[
      (action as any).payload.projectAbbrev
    ]?.loadingState;
    const loadingState = (currentState as RootState).projectMetadataState.data[
      (action as any).payload.projectAbbrev
    ]?.loadingState;
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
    const previousLoadingState =
      (previousState as RootState).projectMetadataState.data[projectAbbrev]?.loadingState;
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

// Launch needed data view fetch after project info retrieved or viewToFetch changes
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't try to read projectAbbrev
    if (!isAnyOf(fetchProjectInfo.fulfilled, fetchDataView.fulfilled)(action)) return false;
    const { projectAbbrev } = (action as any).meta.arg;
    // Check that viewToFetch has incremented
    const previousViewToFetch =
      (previousState as RootState).projectMetadataState.data[projectAbbrev]?.viewToFetch;
    const viewToFetch =
      (currentState as RootState).projectMetadataState.data[projectAbbrev]?.viewToFetch;
    return viewToFetch === 0 || previousViewToFetch !== viewToFetch;
  },
  effect: (action, listenerApi) => {
    const { projectAbbrev } = (action as any).meta.arg;
    const { views, viewToFetch } = (listenerApi.getState() as RootState).projectMetadataState.data[
      projectAbbrev
    ];
    // Dispatch the requested next view load, unless it is out of range (i.e. we are finished)
    // Alternatively could test state and stop if MetadataLoadingState.DATA_LOADED
    if (viewToFetch < 0 || viewToFetch >= Object.keys(views).length) return;
    listenerApi.dispatch(fetchDataView({ projectAbbrev, viewIndex: viewToFetch }));
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
        state.data[projectAbbrev].loadingState === MetadataLoadingState.ERROR ||
        state.data[projectAbbrev].loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
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
      const { mergeAlgorithm, fields, views } = action.payload as FetchProjectInfoResponse;
      state.data[projectAbbrev].mergeAlgorithm = mergeAlgorithm;
      // Sort fields by columnOrder and set state
      fields.sort((a, b) => {
        if (a.columnOrder !== b.columnOrder) {
          return a.columnOrder - b.columnOrder;
        }
        return a.fieldName.localeCompare(b.fieldName, undefined, { sensitivity: 'base' });
      });

      state.data[projectAbbrev].projectFields = fields;
      // Calculate view fields from analysis labels as a map
      const viewFieldMap: Record<string, string[]> = {};
      fields.forEach((field) => {
        viewFieldMap[field.fieldName] = calculateViewFieldNames(
          field,
          state.data[projectAbbrev].mergeAlgorithm!,
        );
      });
      // Calculate view fields (ProjectViewFields) for the project as a whole
      state.data[projectAbbrev].fields = fields.flatMap((projField: ProjectField) =>
        viewFieldMap[projField.fieldName].map((columnName: string) => ({
          ...projField,
          projectFieldName: projField.fieldName,
          columnName,
        })),
      );
      state.data[projectAbbrev].fields = [];
      fields.forEach((projField: ProjectField) => {
        viewFieldMap[projField.fieldName].forEach((columnName: string) => {
          const viewField: ProjectViewField = {
            ...projField,
            projectFieldName: projField.fieldName,
            columnName,
          };
          state.data[projectAbbrev].fields!.push(viewField);
        });
      });
      // Set views, and set view loading states to IDLE for all views
      const eligibleViews = views.filter((view) => view.fields.length > 0);
      eligibleViews.sort((a, b) => a.fields.length - b.fields.length);
      // Calculate view fields for each view
      eligibleViews.forEach((view) => {
        view.viewFields = view.fields.flatMap((field) => viewFieldMap[field]);
      });
      state.data[projectAbbrev].views = {};
      eligibleViews.forEach((view, index) => {
        state.data[projectAbbrev].views![index] = view;
        state.data[projectAbbrev].viewLoadingStates![index] = LoadingState.IDLE;
      });
      state.data[projectAbbrev].viewToFetch = 0;
      // Set column loading states to IDLE for all fields, and initialise unique values
      state.data[projectAbbrev].fieldUniqueValues = {};
      state.data[projectAbbrev].fields!.forEach((field) => {
        state.data[projectAbbrev].fieldLoadingStates[field.columnName!] = LoadingState.IDLE;
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
      const { projectAbbrev, viewIndex } = action.meta.arg;
      const { viewFields } = state.data[projectAbbrev].views[viewIndex];
      state.data[projectAbbrev].viewLoadingStates![viewIndex] = LoadingState.LOADING;
      // If not yet awaiting, start awaiting; if AWAITING or PARTIAL_DATA_LOADED, no change
      if (viewIndex === 0) {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.AWAITING_DATA;
      }
      viewFields.forEach((field) => {
        // Check per-column state; columns new in this load get LOADING status
        if (state.data[projectAbbrev].fieldLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[projectAbbrev].fieldLoadingStates[field] = LoadingState.LOADING;
        }
      });
    });

    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { projectAbbrev, viewIndex } = action.meta.arg;
      const { data } = action.payload as FetchDataViewResponse;
      const { viewFields } = state.data[projectAbbrev].views[viewIndex];

      // For Has_sequences only
      if (viewFields.includes(HAS_SEQUENCES)) {
        replaceHasSequencesNullsWithFalse(data);
      }
      replaceNullsWithEmpty(data);
      state.data[projectAbbrev].emptyColumns = getEmptyStringColumns(data, viewFields);
      replaceDateStrings(data, state.data[projectAbbrev].fields!, viewFields);
      // Each returned view is a superset of the previous; we always replace the data
      state.data[projectAbbrev].metadata = data;

      // Default sort data by Seq_ID, which should be consistent across views.
      // Could be done server-side, in which case this sort operation is redundant but cheap
      if (
        state.data[projectAbbrev].metadata!.length > 0 &&
        state.data[projectAbbrev].metadata![0][SAMPLE_ID_FIELD]
      ) {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        state.data[projectAbbrev].metadata!.sort((a, b) =>
          collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]),
        );
      }
      // Calculate unique values
      // Note that the view is not considered "loaded" until this is done, as we are in the reducer.
      // Would be better to do server-side, but this operation is quite fast.
      // Note that if categorical fields are included in project sub-views, they will be
      // recalculated per-view, to ensure consistency.
      const uniqueVals = calculateUniqueValues(viewFields, state.data[projectAbbrev].fields!, data);

      const geoFields = state.data[projectAbbrev]
        .fields!.filter((field) => field.geoField)
        .map((field) => field.columnName!);

      state.data[projectAbbrev].supportedMaps = calculateSupportedMaps(uniqueVals, geoFields);

      viewFields.forEach((field) => {
        state.data[projectAbbrev].fieldUniqueValues![field] = uniqueVals[field];
      });

      // Set SUCCESS states
      state.data[projectAbbrev].viewLoadingStates![viewIndex] = LoadingState.SUCCESS;
      viewFields.forEach((field) => {
        state.data[projectAbbrev].fieldLoadingStates[field] = LoadingState.SUCCESS;
      });
      // Increment viewToFetch, which will trigger the next view load
      state.data[projectAbbrev].viewToFetch = viewIndex + 1;
      // If this is the full dataset, we are done, otherwise we are in a partial load state
      if (viewIndex === Object.keys(state.data[projectAbbrev].views).length - 1) {
        // NB here expect also that fields.length === state.data[projectAbbrev].fields?.length
        state.data[projectAbbrev].dataLoadTime = new Date().toISOString();
        state.data[projectAbbrev].loadingState = MetadataLoadingState.DATA_LOADED;
      } else {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.PARTIAL_DATA_LOADED;
      }
    });

    builder.addCase(fetchDataView.rejected, (state, action) => {
      const { projectAbbrev, viewIndex } = action.meta.arg;
      const { fields } = state.data[projectAbbrev].views[viewIndex];
      state.data[projectAbbrev].viewLoadingStates![viewIndex] = LoadingState.ERROR;
      // Any column not already loaded by another thunk gets an error state
      fields.forEach((field) => {
        if (state.data[projectAbbrev].fieldLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[projectAbbrev].fieldLoadingStates[field] = LoadingState.ERROR;
        }
      });
      // If this is the first view, we are in an error state, otherwise a partial error state
      if (viewIndex === 0) {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.ERROR;
        state.data[projectAbbrev].errorMessage = `Unable to load project data: ${action.payload}`;
      } else {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.PARTIAL_LOAD_ERROR;
        state.data[projectAbbrev].errorMessage =
          `Unable to complete loading project data: ${action.payload}`;
      }
      // Currently we don't try to fetch more views after an error
      // If we want to, we should incremement viewToFetch if there are views left,
      // and in that case set PARTIAL_DATA_LOADED state instead of error states.
      // The error state would then occur if we try the final view without success.
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
  if (!projectAbbrev) return null; // should not be 0, which is fine
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

// Returns true iff the metadata has not yet loaded to a useable state, i.e. we are awaiting initial
// data. This includes idle and awaiting fields states.
// Returns false if any (including partial) data loaded, or if error state
export const selectAwaitingPartialProjectMetadata = (
  state: RootState,
  projectAbbrev: string | undefined,
) => {
  if (!projectAbbrev) return true;
  const loadingState = state.projectMetadataState.data[projectAbbrev]?.loadingState;
  if (!loadingState) return true;
  return (
    loadingState === MetadataLoadingState.IDLE ||
    loadingState === MetadataLoadingState.FETCH_REQUESTED ||
    loadingState === MetadataLoadingState.AWAITING_FIELDS ||
    loadingState === MetadataLoadingState.FIELDS_LOADED ||
    loadingState === MetadataLoadingState.AWAITING_DATA
  );
};

export const selectProjectMergeAlgorithm = (
  state: RootState,
  projectAbbrev: string | undefined,
) => {
  if (!projectAbbrev) return null;
  return state.projectMetadataState.data[projectAbbrev]?.mergeAlgorithm;
};
