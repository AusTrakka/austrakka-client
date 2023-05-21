// These are view models; should correspond to server-side DTOs

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
