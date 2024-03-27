// These are view models; should correspond to server-side DTO.
export interface Project {
  projectId: number,
  abbreviation: string,
  name: string,
  description: string,
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

export interface Plot {
  plotId: number,
  abbreviation: string,
  name: string,
  description: string,
  plotType: string,
  spec: string,
  projectId: number,
  projectName: string
  projectAbbreviation: string
  projectGroupId: number
  isActive: boolean
}

export interface JobInstance {
  jobInstanceId: number;
  analysisId: number;
  analysisName: string;
  projectId: number;
  projectMembersGroupId: number;
  projectName: string;
  startTime: string;
  completedTime: string;
  wasScheduled: boolean;
  resultsDataId: number;
  treeId: number;
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

export interface Member {
  objectId: string,
  roles: string[],
  organization:{
    id: number,
    abbreviation: string,
  },
  displayName: string,
}

export interface User {
  userId: number,
  objectId: number,
  isActive: boolean,
  organisation: {
    id: number,
    abbreviation: string,
  }
  orgName: string,
  isAustrakkaAdmin: boolean,
  userRoleGroup: UserRoleGroup[],
  displayName: string,
  createdBy: Date,
  contactEmail: string,
  lastUpdatedBy: Date,
  IsAustrakkaProcess: boolean
}

export interface UserDetails {
  displayName: string,
  orgName: string,
  userRoleGroup: UserRoleGroup[],
  created: Date,
}

export interface MetaDataColumnMapping {
  metaDataColumnMappingId: number,
  metaDataColumnName: string,
  metaDataColumnPrimitiveType: string,
  metaDataColumnValidValues: string[],
  isRequired: boolean,
  isDispalyedByDefault: boolean,
  isActive: boolean,
  canVisualise: boolean,
}

// this is a common interface representing metadata fields,
// with information about types and display order
export interface Field {
  columnName: string,
  primitiveType: string | null,
  metaDataColumnTypeName: string,
  canVisualise: boolean,
  columnOrder: number,
}

export interface MetaDataColumn extends Field {
  metaDataColumnId: number
  columnName: string
  metaDataColumnTypeId: number
  metaDataColumnValidValues: string[] | null
  primitiveType: string | null
  canVisualise: boolean
  columnOrder: number
  isDisplayedAsDefault: boolean
  isActive: boolean
  minWidth: number
}

// This represents the ProjectFieldDTO, with nested analysisLabels
// It is appropriate for use in project management interfaces
// It is not appropriate for representing the columns that will be found in a project view
export interface ProjectField {
  projectFieldId: number,
  fieldName: string,
  primitiveType: string,
  metaDataColumnTypeName: string,
  fieldSource: string,
  columnOrder: number,
  canVisualise: boolean,
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
  primitiveType: string,
  metaDataColumnTypeName: string,
  fieldSource: string,
  columnOrder: number,
  canVisualise: boolean,
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

export interface Proforma {
  proformaId: number,
  proFormaVersionId: number,
  version: number,
  name: string,
  abbreviation: string,
  description: string,
  isActive: boolean,
  isCurrent: boolean,
  hasAttached: boolean,
  created: string,
  lastUpdated: string,
  createdBy: string,
  lastUpdatedBy: string,
  columnMappings: MetaDataColumnMapping[],
}

export interface ProFormaVersion {
  proFormaVersionId: number,
  proFormaId: number,
  version: number,
  abbreviation: string,
  originalFileName: string,
  fileName: string,
  columnMappings: MetaDataColumnMapping[],
  isCurrent: boolean,
  assetId : number,
  created: Date,
  createdBy: string,
}

export interface ThresholdAlertDTO {
  alertLevelOrder: number;
  alertLevel: string;
  categoryField: string;
  categoryValue: string;
  ratio: number | null;
  recentCount: number;
}

export interface UserRoleGroup {
  user: any,
  role: {
    id: number,
    name: string,
  }
  group: {
    id: number,
    name: string,
  }
}

export interface Group {
  groupId: number,
  name: string,
  lastUpdated: string,
  lastUpdatedBy: string,
  created: string,
  createdBy: string,
  organisation: {
    abbreviation: string
  }
}

export interface DataSetEntry {
  entryId: number;
  dataSetId: number;
  fileName: string;
  analysisLabel: string;
  createdBy: string;
  uploadedDate: Date;
  fields: string[];
}
