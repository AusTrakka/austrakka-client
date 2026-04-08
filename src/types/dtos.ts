// These are view models; should correspond to server-side DTO.
export interface Project {
  projectId: number,
  globalId: string,
  abbreviation: string,
  name: string,
  description: string,
  type: string,
  projectMembers: {
    id: number,
    name: string
  },
  projectAnalyses: {
    id: number,
    name: string
  }[],
  created: Date,
  // could add auditable fields - created, createdBy
}

export interface TreeVersion {
  treeVersionId: number;
  treeId: number;
  treeName: string;
  projectId: number;
  projectMembersGroupId: number;
  projectName: string;
  completedTime: string;
  wasScheduled: boolean;
  newickTree: string;
  isActive: boolean;
  versionName: string;
  version: string;
  created: string;
  lastUpdated: string;
  createdBy: string;
  lastUpdatedBy: string;
}

export interface PlotListing {
  plotId: number,
  abbreviation: string,
  name: string,
  description: string,
  plotType: string,
  projectId: number,
  // also projectName, and isActive. projectAbbrev??
}

// this is a common interface representing metadata fields,
// with information about types and display order
export interface Field {
  columnName: string,
  primitiveType: string | null,
  metaDataColumnTypeName: string,
  metaDataColumnValidValues: string[] | null,
  canVisualise: boolean,
  columnOrder: number,
}

// Not a DTO: represents a field deduced from uploaded data
export interface DeducedField extends Field {
  displayedFieldType: string,
  fieldTypeSource: string,
}

// This represents the ProjectFieldDTO, with nested analysisLabels
// It is appropriate for use in project management interfaces
// It is not appropriate for representing the columns that will be found in a project view
export interface ProjectField {
  projectFieldId: number,
  fieldName: string,
  primitiveType: string | null,
  metaDataColumnTypeName: string,
  fieldSource: string,
  columnOrder: number,
  canVisualise: boolean,
  hidden: boolean,
  metaDataColumnValidValues: string[] | null,
  analysisLabels: string[],
  createdBy: string,
}

// This is not a DTO, but a calculated field representing a column found in a project view
// The projectFieldId and projectFieldName will not be unique
// The columnName is formed from the projectFieldName and the analysisLabel
export interface ProjectViewField extends Field {
  columnName: string,
  projectFieldId: number,
  projectFieldName: string,
  primitiveType: string | null,
  metaDataColumnTypeName: string,
  fieldSource: string,
  columnOrder: number,
  canVisualise: boolean,
  hidden: boolean,
  metaDataColumnValidValues: string[] | null,
}

export interface ProjectView {
  id: number,
  fileName: string,
  blobFilePath: string,
  originalFileName: string,
  isBase: boolean,
  fields: string[],
  viewFields: string[] // this is currently calculated client-side
}

