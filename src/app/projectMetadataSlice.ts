/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/brace-style */
import { PayloadAction, createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import MetadataLoadingState from '../constants/metadataLoadingState';
import { Project, ProjectField, ProjectView, ProjectViewField } from '../types/dtos';
import { Sample } from '../types/sample.interface';
import { getProjectFields, getProjectSettings, getProjectViewData, getProjectViews } from '../utilities/resourceUtils';
import type { RootState } from './store';
import { listenerMiddleware } from './listenerMiddleware';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import { replaceHasSequencesNullsWithFalse } from '../utilities/helperUtils';
import { MergeAlgorithm } from '../constants/mergeAlgorithm';
import { FieldSource } from '../constants/fieldSource';

export interface ProjectMetadataState {
  projectAbbrev: string | null
  mergeAlgorithm: string | null
  loadingState: MetadataLoadingState,
  projectFields: ProjectField[] | null
  fields: ProjectViewField[] | null
  fieldUniqueValues: Record<string, string[] | null> | null
  views: Record<number, ProjectView>
  viewLoadingStates: Record<number, LoadingState>
  viewToFetch: number
  metadata: Sample[] | null
  fieldLoadingStates: Record<string, LoadingState>
  errorMessage: string | null
}

const projectMetadataInitialStateCreator = (projectAbbrev: string): ProjectMetadataState => ({
  projectAbbrev,
  mergeAlgorithm: null,
  loadingState: MetadataLoadingState.IDLE,
  projectFields: null,
  fields: null,
  fieldUniqueValues: null,
  views: {},
  viewLoadingStates: {},
  viewToFetch: 0,
  metadata: null,
  fieldLoadingStates: {},
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
  mergeAlgorithm: string,
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
    const projectSettingsResponse = await getProjectSettings(projectAbbrev, token!);
    if (projectSettingsResponse.status !== 'Success') {
      return rejectWithValue(projectSettingsResponse.error);
    }
    return fulfillWithValue<FetchProjectInfoResponse>({
      mergeAlgorithm: projectSettingsResponse.data.mergeAlgorithm,
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

// reducer utility functions - single-use, but improve reducer readability

// Given a list of field names, calculate the viewFields for that field
// TODO this algorithm is correct, but override mode will cause a bug until implemented server-side
//      if override mode is set, a bare field name will be included in fields, but not actual views
//      this will cause a bug when filtering the resulting empty field for null/not null
function calculateViewFieldNames(
  field: ProjectField,
  mergeAlgorithm: string,
): string[] {
  if (mergeAlgorithm === MergeAlgorithm.SHOW_ALL && field.fieldSource === FieldSource.DATASET) {
    return field.analysisLabels.map(label => `${field.fieldName}_${label}`);
  }
  // override mode, or fieldSource is sample, or fieldSource is both (Seq_ID)
  return [field.fieldName];
}

function getFieldDetails(
  fieldNames: string[],
  projectViewFields: ProjectViewField[],
): ProjectViewField[] {
  return fieldNames.map(
    field => {
      const fieldDetail = projectViewFields.find(f => f.columnName === field);
      if (!fieldDetail) {
        throw new Error(
          'Unexpected error in fetchDataView.fullfilled: ' +
          `field ${field} in data not found in expected fields`,
        );
      }
      return fieldDetail;
    },
  );
}

// Given sample data and field details, replace date strings with Date objects
function replaceDateStrings(data: Sample[], fields: ProjectViewField[], fieldNames: string[]) {
  const fieldDetails = getFieldDetails(fieldNames, fields);
  const dateFields = fieldDetails.filter(field => field.primitiveType === 'date');
  dateFields.forEach(field => {
    data.forEach(sample => {
      const dateString = sample[field.columnName];

      // Date filter function dont handle strings thus making null if it is empty
      if (dateString && dateString !== '') {
        const isISOFormat = dateString.includes('T');

        if (isISOFormat) {
          // If it's in ISO format, create a new Date object directly from the dateString
          sample[field.columnName] = new Date(dateString);
        } else {
          // If it's a regular date string, parse the components and create a new Date object
          const year = parseInt(dateString.slice(0, 4), 10);
          const month = parseInt(dateString.slice(5, 7), 10) - 1; // Months are zero-based
          const day = parseInt(dateString.slice(8, 10), 10);

          sample[field.columnName] = new Date(year, month, day, 0, 0, 0);
        }
      }
      else
      {
        sample[field.columnName] = null;
      }
    });
  });

  return data;
}

// Given a list of field names, calculate or look up the unique values for the fields
function calculateUniqueValues(
  fieldNames: string[],
  projectViewFields: ProjectViewField[],
  data: Sample[],
) : Record<string, string[]> {
  const uniqueValues: Record<string, string[]> = {};
  const fieldDetails = getFieldDetails(fieldNames, projectViewFields);
  // fields with defined valid values can just be looked up
  const categoricalFields = fieldDetails.filter(field =>
    field.canVisualise && field.metaDataColumnValidValues);
  categoricalFields.forEach(field => {
    uniqueValues![field.columnName] = field.metaDataColumnValidValues!;
  });
  // visualisable string field unique values must be calculated
  const visualisableFields = fieldDetails.filter(field =>
    field.canVisualise && field.primitiveType === 'string');
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
    uniqueValues[field.columnName] = Array.from(valueSets[field.columnName]);
  });
  // Sort unique values using natural sort order
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  visualisableFields.forEach(field => {
    uniqueValues[field.columnName]!.sort(collator.compare);
  });
  return uniqueValues;
}

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
      const { mergeAlgorithm, fields, views } = action.payload as FetchProjectInfoResponse;
      state.data[projectAbbrev].mergeAlgorithm = mergeAlgorithm;
      // Sort fields by columnOrder and set state
      fields.sort((a, b) => a.columnOrder - b.columnOrder);
      state.data[projectAbbrev].projectFields = fields;
      // Calculate view fields from analysis labels as a map
      const viewFieldMap: Record<string, string[]> = {};
      fields.forEach(field => {
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
        })));
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
      const eligibleViews = views.filter(view => view.fields.length > 0);
      eligibleViews.sort((a, b) => a.fields.length - b.fields.length);
      // Calculate view fields for each view
      eligibleViews.forEach((view) => {
        view.viewFields = view.fields.map(field => viewFieldMap[field]).flat();
      });
      state.data[projectAbbrev].views = {};
      eligibleViews.forEach((view, index) => {
        state.data[projectAbbrev].views![index] = view;
        state.data[projectAbbrev].viewLoadingStates![index] = LoadingState.IDLE;
      });
      // Set column loading states to IDLE for all fields, and initialise unique values
      state.data[projectAbbrev].fieldUniqueValues = {};
      state.data[projectAbbrev].fields!.forEach((field) => {
        state.data[projectAbbrev].fieldLoadingStates[field.columnName] = LoadingState.IDLE;
        state.data[projectAbbrev].fieldUniqueValues![field.columnName] = null;
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
        if (state.data[projectAbbrev].fieldLoadingStates[field] !== LoadingState.SUCCESS) {
          state.data[projectAbbrev].fieldLoadingStates[field] = LoadingState.LOADING;
        }
      });
    });

    builder.addCase(fetchDataView.fulfilled, (state, action) => {
      const { projectAbbrev, viewIndex } = action.meta.arg;
      const { data } = action.payload as FetchDataViewResponse;
      const { viewFields } = state.data[projectAbbrev].views[viewIndex];
      // Each returned view is a superset of the previous; we always replace the data
      // I will go through all the data and if the field is has_sequence
      // I will change all null values to false
      replaceHasSequencesNullsWithFalse(data);
      replaceDateStrings(data, state.data[projectAbbrev].fields!, viewFields);

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
      const uniqueVals = calculateUniqueValues(viewFields, state.data[projectAbbrev].fields!, data);
      viewFields.forEach((field) => {
        state.data[projectAbbrev].fieldUniqueValues![field] = uniqueVals[field];
      });
      // Set SUCCESS states
      state.data[projectAbbrev].viewLoadingStates![viewIndex] = LoadingState.SUCCESS;
      viewFields.forEach(field => {
        state.data[projectAbbrev].fieldLoadingStates[field] = LoadingState.SUCCESS;
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
        state.data[projectAbbrev].errorMessage = `Unable to complete loading project data: ${action.payload}`;
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
          loadingState === MetadataLoadingState.FIELDS_LOADED ||
          loadingState === MetadataLoadingState.AWAITING_DATA;
  };

export const selectProjectMergeAlgorithm =
  (state: RootState, projectAbbrev: string | undefined) => {
    if (!projectAbbrev) return null;
    return state.projectMetadataState.data[projectAbbrev]?.mergeAlgorithm;
  };
