
// These are view models; should correspond to server-side DTOs

export interface Project {
  projectId: number,
  abbreviation: string,
  name: string,
  description: string
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
  // also projectName, and isActive. projectAbbrev??
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