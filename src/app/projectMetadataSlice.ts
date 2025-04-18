/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/brace-style */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import LoadingState from '../constants/loadingState';
import MetadataLoadingState from '../constants/metadataLoadingState';
import { Field, ProjectField, ProjectView, ProjectViewField } from '../types/dtos';
import { Sample } from '../types/sample.interface';
import type { RootState } from './store';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import {
  calculateUniqueValues,
  replaceDateStrings,
  replaceNullsWithEmpty,
} from './metadataSliceUtils';
import { MergeAlgorithm } from '../constants/mergeAlgorithm';
import { FieldSource } from '../constants/fieldSource';
import { localProjectAbbrev } from '../constants/standaloneClientConstants';

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

interface AddMetadataParams {
  uploadedData: Sample[]
  uploadedFields: string[] // could turn this into field objects if we include a UI for setting types
}

const fieldToProjectField = (field: Field, idx: number) : ProjectField => ({
  ...field,
  projectFieldId: idx,
  fieldName: field.columnName,
  fieldSource: field.columnName === SAMPLE_ID_FIELD ? FieldSource.BOTH : FieldSource.SAMPLE,
  hidden: false,
  analysisLabels: [],
  createdBy: 'upload', // TODO why is this here?
});

const fieldToProjectViewField = (field: Field, idx: number) : ProjectViewField => ({
  ...field,
  projectFieldId: idx,
  projectFieldName: field.columnName,
  fieldSource: MergeAlgorithm.OVERRIDE,
  hidden: false,
});

// Temporarily, we just make all fields visualisable strings
const makeVisualisableStringField = (fieldName: string, idx: number): Field => ({
  columnName: fieldName,
  primitiveType: 'string',
  metaDataColumnTypeName: 'string',
  metaDataColumnValidValues: null,
  canVisualise: true,
  columnOrder: idx,
});

export const projectMetadataSlice = createSlice({
  name: 'projectMetadata',
  initialState,
  reducers: {
    addMetadata: (state, action: PayloadAction<AddMetadataParams>) => {
      const { uploadedData, uploadedFields } = action.payload;

      // If updating existing metadata, should use existing state to return modified
      // for now treat all as visualisable string fields, and just replace data
      
      if (!state.data[localProjectAbbrev]) {
        state.data[localProjectAbbrev] = projectMetadataInitialStateCreator(localProjectAbbrev);
      }

      const metadataState = state.data[localProjectAbbrev];

      const fields = uploadedFields.map(makeVisualisableStringField);
      metadataState.projectFields = fields.map(fieldToProjectField);
      metadataState.fields = fields.map(fieldToProjectViewField);
      metadataState.views = {
        1: {
          id: 1,
          fileName: 'dummy.csv',
          blobFilePath: 'dummy.csv',
          originalFileName: 'dummy.csv', // should we use uploaded CSV name?
          isBase: true,
          fields: uploadedFields,
          viewFields: uploadedFields,
        },
      };
      metadataState.metadata = uploadedData;

      // Field unique values
      // For now, this is going to calculate unique vals for ALL fields!
      metadataState.fieldUniqueValues = {};
      const uniqueVals = calculateUniqueValues(
        uploadedFields,
        metadataState.fields,
        uploadedData, // should be resulting merged data, if merging
      );
      metadataState.fields!.forEach((field) => {
        metadataState.fieldUniqueValues![field.columnName] = uniqueVals[field.columnName!];
      });
      
      // Loading states
      metadataState.loadingState = MetadataLoadingState.DATA_LOADED;
      metadataState.viewLoadingStates = { 1: LoadingState.SUCCESS };
      fields.forEach(fld => {
        metadataState.fieldLoadingStates[fld.columnName] = LoadingState.SUCCESS;
      });
      
      // Might want to add in, from deleted reducers
      // replaceNullsWithEmpty(data);
      // replaceDateStrings(data, state.data[projectAbbrev].fields!, viewFields);
      // Default sort data by Seq_ID, which should be consistent across views.
      // Could be done server-side, in which case this sort operation is redundant but cheap
      // if (state.data[projectAbbrev].metadata!.length > 0 &&
      //   state.data[projectAbbrev].metadata![0][SAMPLE_ID_FIELD]) {
      //   const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      //   state.data[projectAbbrev].metadata!.sort((a, b) =>
      //     collator.compare(a[SAMPLE_ID_FIELD], b[SAMPLE_ID_FIELD]));
      // }
    },
  },
});

// reducer
export default projectMetadataSlice.reducer;

export const { addMetadata } = projectMetadataSlice.actions;

// selectors

export const selectProjectMetadata:
(state: RootState, projectAbbrev: string | null | undefined) => ProjectMetadataState | null =
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

// This mirrors the loading state used for server-side data;
// for a local client we expect this to be IDLE or DATA_LOADED
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
