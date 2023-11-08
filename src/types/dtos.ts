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
  created: Date
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
  projectAbbrev: string
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
  isApproved: boolean;
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
  lastLoggedIn: string,
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
  lastLoggedIn: Date,
  createdBy: Date,
  lastUpdatedBy: Date,
  IsAustrakkaProcess: boolean
}

export interface UserDetails {
  displayName: string,
  orgName: string,
  userRoleGroup: UserRoleGroup[],
  created: Date,
  lastUpdated: Date,
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

export interface MetaDataColumn {
  metaDataColumnId: number
  columnName: string
  metaDataColumnTypeId: number
  primitiveType: string
  canVisualise: boolean
  columnOrder: number
  isDisplayedAsDefault: boolean
  isActive: boolean
  minWidth: number
}

interface MetadataValue {
  key: string;
  value: string;
}

export interface AnalysisResultMetadata {
  created: string;
  createdBy: string | null; // Assuming createdBy can be string or null
  isCurrent: boolean;
  lastUpdated: string;
  lastUpdatedBy: string | null; // Assuming lastUpdatedBy can be string or null
  metadataValues: MetadataValue[];
  ownerGroup: string;
  sampleName: string;
  sharedGroups: string[]; // Assuming this is an array of strings
  status: boolean;
  submissionId: number;
  versionId: number;
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
  created: string,
  lastUpdated: string,
  createdBy: string,
  lastUpdatedBy: string,
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
  groupId: number | undefined,
  name: string,
  lastUpdated: string,
  lastUpdatedBy: string,
  created: string,
  createdBy: string,
  organisation: {
    abbreviation: string
  }
}

export interface DisplayField {
  canVisualise: boolean,
  columnName: string,
  columnOrder: number,
  isActive: boolean,
  isDisplayedAsDefault: boolean,
  metaDataColumnId: number,
  metaDataColumnTypeId: number,
  minWidth: number,
  primitiveType: string,
}

export interface Sample {

}
