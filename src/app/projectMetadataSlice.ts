/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/brace-style */
import { PayloadAction, createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import MetadataLoadingState from '../constants/metadataLoadingState';
import { Project, ProjectField, ProjectView } from '../types/dtos';
import { Sample } from '../types/sample.interface';
import { getProjectFields, getProjectViewData, getProjectViews } from '../utilities/resourceUtils';
import type { RootState } from './store';
import { listenerMiddleware } from './listenerMiddleware';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';

export interface ProjectMetadataState {
  projectAbbrev: string | null
  loadingState: MetadataLoadingState,
  fields: ProjectField[] | null
  fieldUniqueValues: Record<string, string[] | null> | null
  views: Record<number, ProjectView>
  viewLoadingStates: Record<number, LoadingState>
  viewToFetch: number
  metadata: Sample[] | null
  columnLoadingStates: Record<string, LoadingState>
  errorMessage: string | null
}

const projectMetadataInitialStateCreator = (projectAbbrev: string): ProjectMetadataState => ({
  projectAbbrev,
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

interface ProjectMetadataSliceState {
  data: { [projectAbbrev: string]: ProjectMetadataState },
  token: string | null, // must be provided by calling component along with each fetch request
}

const initialState: ProjectMetadataSliceState = {
  data: {},
  token: null,
};

// Input parameters and return types (on success/fulfilled) for actions and thunks

interface FetchProjectMetadataParams {
  projectAbbrev: string,
  token: string,
}

interface FetchProjectInfoParams {
  projectAbbrev: string,
}

interface FetchProjectInfoResponse {
  fields: ProjectField[],
  views: ProjectView[],
}

interface FetchDataViewParams {
  projectAbbrev: string,
  viewIndex: number, // this is the lookup index, not the viewId
}

interface FetchDataViewResponse {
  data: Sample[],
}

// Fetch project fields and views
const fetchProjectInfo = createAsyncThunk(
  'projectMetadata/fetchProjectFields',
  async (
    params: FetchProjectInfoParams,
    { rejectWithValue, fulfillWithValue, getState },
  ):Promise<Project | unknown > => {
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
    return fulfillWithValue<FetchProjectInfoResponse>({
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
  ):Promise<Project | unknown > => {
    const { projectAbbrev, viewIndex } = params;
    const state = getState() as RootState;
    const { token } = state.projectMetadataState;
    const view = state.projectMetadataState.data[projectAbbrev].views[viewIndex];

    const response = await getProjectViewData(projectAbbrev, view.id, token!);
    if (response.ok) {
      try {
        const data: Sample[] = await response.json();
        return fulfillWithValue<FetchDataViewResponse>({ data });
      } catch (e) {
        return rejectWithValue('An error occurred parsing project metadata');
      }
    }
    return rejectWithValue('An error occurred fetching project metadata');
  },
);

// These listeners launch thunks in response to state changes or actions
// The state update triggered by the listener will be the thunk's pending action

// Launch fetchProjectFields in response to metadata fetch request
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't try to read projectAbbrev
    if (action.type !== 'projectMetadata/fetchProjectMetadata') return false;
    // Check that the reducer logic is telling us to trigger a new load process
    const previousLoadingState = (previousState as RootState).projectMetadataState
      .data[(action as any).payload.projectAbbrev]?.loadingState;
    const loadingState = (currentState as RootState).projectMetadataState
      .data[(action as any).payload.projectAbbrev]?.loadingState;
    return previousLoadingState !== MetadataLoadingState.FETCH_REQUESTED &&
           loadingState === MetadataLoadingState.FETCH_REQUESTED;
  },
  effect: (action, listenerApi) => {
    listenerApi.dispatch(
      fetchProjectInfo({ projectAbbrev: (action as any).payload.projectAbbrev }),
    );
  },
});

// Launch needed data view fetch after viewToFetch changes
listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Return early if wrong action; don't try to read projectAbbrev
    if (!isAnyOf(fetchProjectInfo.fulfilled, fetchDataView.fulfilled)(action)) return false;
    const { projectAbbrev } = (action as any).meta.arg;
    // Check that viewToFetch has incremented
    const previousViewToFetch = (previousState as RootState).projectMetadataState
      .data[projectAbbrev]?.viewToFetch;
    const viewToFetch = (currentState as RootState).projectMetadataState
      .data[projectAbbrev]?.viewToFetch;
    return viewToFetch === 0 || previousViewToFetch !== viewToFetch;
  },
  effect: (action, listenerApi) => {
    const { projectAbbrev } = (action as any).meta.arg;
    const { views, viewToFetch } =
      (listenerApi.getState() as RootState).projectMetadataState.data[projectAbbrev];
    // Dispatch the requested next view load, unless it is out of range (i.e. we are finished)
    // Alternatively could test state and stop if MetadataLoadingState.DATA_LOADED
    if (viewToFetch < 0 || viewToFetch >= Object.keys(views).length) return;
    listenerApi.dispatch(
      fetchDataView({ projectAbbrev, viewIndex: viewToFetch }),
    );
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
      // Only initialise fetch if in allowed state; do not reload loading data
      if (state.data[projectAbbrev].loadingState === MetadataLoadingState.IDLE ||
          state.data[projectAbbrev].loadingState === MetadataLoadingState.ERROR ||
          state.data[projectAbbrev].loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
        // If we were in an error state and are refreshing, clear data
        if (state.data[projectAbbrev].loadingState !== MetadataLoadingState.IDLE) {
          state.data[projectAbbrev] = projectMetadataInitialStateCreator(projectAbbrev);
        }
        state.data[projectAbbrev].loadingState = MetadataLoadingState.FETCH_REQUESTED;
        state.token = token;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProjectInfo.pending, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      state.data[projectAbbrev].loadingState = MetadataLoadingState.AWAITING_FIELDS;
    });
    builder.addCase(fetchProjectInfo.fulfilled, (state, action) => {
      const { projectAbbrev } = action.meta.arg;
      const { fields, views } = action.payload as FetchProjectInfoResponse;
      state.data[projectAbbrev].fields = fields;
      // Set views (field lists), and set view loading states to IDLE for all views
      const eligibleViews = views.filter(view => view.fields.length > 0);
      eligibleViews.sort((a, b) => a.fields.length - b.fields.length);
      state.data[projectAbbrev].views = {};
      eligibleViews.forEach((view, index) => {
        state.data[projectAbbrev].views![index] = view;
        state.data[projectAbbrev].viewLoadingStates![index] = LoadingState.IDLE;
      });
      // Set column loading states to IDLE for all fields, and initialise unique values
      state.data[projectAbbrev].fieldUniqueValues = {};
      state.data[projectAbbrev].fields!.forEach((field) => {
        state.data[projectAbbrev].columnLoadingStates[field.fieldName] = LoadingState.IDLE;
        state.data[projectAbbrev].fieldUniqueValues![field.fieldName] = null;
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
      const { fields } = state.data[projectAbbrev].views[viewIndex];
      state.data[projectAbbrev].viewLoadingStates![viewIndex] = LoadingState.LOADING;
      // If not yet awaiting, start awaiting; if AWAITING or PARTIAL_DATA_LOADED, no change
      if (viewIndex === 0) {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.AWAITING_DATA;
      }
      fields.forEach(field => {
        // Check per-column state; columns new in this load get LOADING status
        if (state.data[projectAbbrev].columnLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[projectAbbrev].columnLoadingStates[field] = LoadingState.LOADING;
        }
      });
    });
    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { projectAbbrev, viewIndex } = action.meta.arg;
      const { data } = action.payload as FetchDataViewResponse;
      const { fields } = state.data[projectAbbrev].views[viewIndex];
      // Each returned view is a superset of the previous; we always replace the data
      state.data[projectAbbrev].metadata = data;
      // Default sort data by Seq_ID, which should be consistent across views.
      // Could be done server-side, in which case this sort operation is redundant but cheap
      if (state.data[projectAbbrev].metadata!.length > 0 &&
          state.data[projectAbbrev].metadata![0][SAMPLE_ID_FIELD]) {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        state.data[projectAbbrev].metadata!.sort((a, b) =>
          collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]));
      }
      // Calculate unique values
      // Note that the view is not considered "loaded" until this is done, as we are in the reducer.
      // Would be better to do server-side, but this operation is quite fast.
      // Note that if categorical fields are included in project sub-views, they will be
      // recalculated per-view, to ensure consistency.
      const fieldDetails: ProjectField[] = fields.map(
        field => {
          const fieldDetail = state.data[projectAbbrev].fields!.find(f => f.fieldName === field);
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
        state.data[projectAbbrev].fieldUniqueValues![field.fieldName] =
          field.metaDataColumnValidValues;
      });
      // visualisable string field unique values must be calculated
      const visualisableFields = fieldDetails.filter(field =>
        field.canVisualise && field.fieldDataType === 'string');
      const valueSets : Record<string, Set<string>> = {};
      visualisableFields.forEach(field => {
        valueSets[field.fieldName] = new Set();
      });
      data.forEach(sample => {
        visualisableFields.forEach(field => {
          const value = sample[field.fieldName];
          // we conflate the string 'null' with empty values, but there may not be a better option
          valueSets[field.fieldName].add(value === null ? 'null' : value);
        });
      });
      visualisableFields.forEach(field => {
        state.data[projectAbbrev].fieldUniqueValues![field.fieldName] =
          Array.from(valueSets[field.fieldName]);
      });
      // Sort unique values using natural sort order
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      visualisableFields.forEach(field => {
        state.data[projectAbbrev].fieldUniqueValues![field.fieldName]!.sort(collator.compare);
      });
      // Set SUCCESS states
      state.data[projectAbbrev].viewLoadingStates![viewIndex] = LoadingState.SUCCESS;
      fields.forEach(field => {
        state.data[projectAbbrev].columnLoadingStates[field] = LoadingState.SUCCESS;
      });
      // Increment viewToFetch, which will trigger the next view load
      state.data[projectAbbrev].viewToFetch = viewIndex + 1;
      // If this is the full dataset, we are done, otherwise we are in a partial load state
      if (viewIndex === Object.keys(state.data[projectAbbrev].views).length - 1) {
        // NB here expect also that fields.length === state.data[projectAbbrev].fields?.length
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
      fields.forEach(field => {
        if (state.data[projectAbbrev].columnLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[projectAbbrev].columnLoadingStates[field] = LoadingState.ERROR;
        }
      });
      // If this is the first view, we are in an error state, otherwise a partial error state
      if (viewIndex === 0) {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.ERROR;
        state.data[projectAbbrev].errorMessage = `Unable to load project data: ${action.payload}`;
      } else {
        state.data[projectAbbrev].loadingState = MetadataLoadingState.PARTIAL_LOAD_ERROR;
        state.data[projectAbbrev].errorMessage = `Unable to complete loading project data: ${action.payload}`;
      }
      // Currently we don't try to fetch more views after an error
      // If we want to, we should incremement viewToFetch if there are views left,
      // and set PARTIAL_DATA_LOADED state instead of error states.
    });
  },
});

// reducer
export default projectMetadataSlice.reducer;

// actions only. Thunks are for internal state machine use
export const { fetchProjectMetadata } = projectMetadataSlice.actions;

// selectors

export const selectProjectMetadata:
(state: RootState, projectAbbrev: string | undefined) => ProjectMetadataState | null =
  (state, projectAbbrev) => {
    if (!projectAbbrev) return null; // should not be 0, which is fine
    return state.projectMetadataState.data[projectAbbrev!] ?? null;
  };

// May want to also include per-field loading state in this selector
export const selectProjectMetadataFields = (state: RootState, projectAbbrev: string | undefined) =>
{
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
export const selectAwaitingProjectMetadata =
  (state: RootState, projectAbbrev: string | undefined) => {
    if (!projectAbbrev) return true;
    const loadingState = state.projectMetadataState.data[projectAbbrev]?.loadingState;
    return loadingState === MetadataLoadingState.IDLE ||
          loadingState === MetadataLoadingState.FETCH_REQUESTED ||
          loadingState === MetadataLoadingState.AWAITING_FIELDS ||
          loadingState === MetadataLoadingState.AWAITING_DATA;
  };
