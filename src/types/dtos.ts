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

export interface Member {
  objectId: string,
  roles: string[],
  organization:{
    id: number,
    abbreviation: string,
  },
  displayName: string,
  contactEmail: string,
}

export interface User {
  objectId: string,
  globalId: string,
  isActive: boolean,
  orgId: number,
  orgAbbrev: string,
  orgName: string,
  isAusTrakkaAdmin: boolean,
  groupRoles: GroupRole[],
  displayName: string,
  created: Date,
  contactEmail: string,
  IsAusTrakkaProcess: boolean,
  analysisServerUsername: string,
  privileges: GroupedPrivilegesByRecordType[],
}

export interface UserV2 {
  objectId: string,
  globalId: string,
  isActive: boolean,
  orgGlobalId:string,
  orgAbbrev: string,
  orgName: string,
  isAusTrakkaAdmin: boolean,
  displayName: string,
  created: Date,
  contactEmail: string,
  IsAusTrakkaProcess: boolean,
  analysisServerUsername: string,
  privileges: GroupedPrivilegesByRecordType[],
}

export interface UserMe {
  objectId: string,
  displayName: string,
  contactEmail: string,
  orgId: number,
  orgAbbrev: string,
  orgName: string,
  analysisServerUsername: string,
  scopes: GroupedPrivilegesByRecordTypeWithScopes[],
}

export interface GroupedPrivilegesByRecordTypeWithScopes {
  recordType: string,
  recordRoles: PrivilegeWithRolesWithScopes[],
}

export interface PrivilegeWithRolesWithScopes {
  recordName: string,
  recordGlobalId: string,
  roles: RecordRoleWithScopes[],
}
export interface GroupedPrivilegesByRecordType {
  recordType: string,
  recordRoles: PrivilegeWithRoles[],
}

export interface PrivilegeWithRoles {
  recordName: string,
  recordGlobalId: string,
  roles: RecordRole[],
}

export interface RecordRole {
  roleName: string,
  privilegeLevel: number,
  privilegeGlobalId?: string,
}

export interface RecordRoleWithScopes {
  roleName: string,
  privilegeLevel: number,
  privilegeGlobalId: string,
  scopes: string[],
}

export interface UserList {
  name: string,
  id: string,
  globalId: string,
  organisation: string,
  contactEmail: string,
  isActive: boolean,
  created: string,
  createdBy: string,
  isAusTrakkaAdmin: boolean,
  isAusTrakkaProcess: boolean,
  analysisServerUsername: string,
}

export interface UserListV2 {
  name: string,
  id: string,
  organisation: string,
  contactEmail: string,
  isActive: boolean,
  created: string,
  createdBy: string,
  isAusTrakkaAdmin: boolean,
  isAusTrakkaProcess: boolean,
  analysisServerUsername: string,
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
  metaDataColumnValidValues: string[] | null,
  canVisualise: boolean,
  columnOrder: number,
}

export interface MetaDataColumn extends Field {
  metaDataColumnId: number
  columnName: string
  metaDataColumnTypeId: number
  metaDataColumnValidValues: string[] | null
  primitiveType: string | null
  description: string
  nndssFieldLabel: string
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
  primitiveType: string,
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

export interface GroupRole {
  role: {
    id: number,
    name: string,
  }
  group: Group
}

export interface MinimalScope {
  scopePath: string,
  shortDescription: string,
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
    name: string
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

export interface Role {
  roleId: number,
  name: string,
  description: string,
}

export interface RolesV2 {
  name: string,
  globalId: string,
  allowedRootResourceTypes: AllowedResourceTypes[]
  privilegeLevel: number,
}

export interface AllowedResourceTypes {
  globalId: string
  name: string,
  isAggregateRoot: boolean,
}

export interface FeedbackPost {
  title: string,
  description: string,
  currentPage: string,
}

export interface Feedback {
  feedbackPost: FeedbackPost,
  id: string,
}

export interface ProjectDashboardDetails {
  projectDashboardId: number,
  name: string,
}

export interface UserPatch {
  displayName: string,
  contactEmail: string,
  orgAbbrev: string,
  isActive: boolean,
  analysisServerUsername: string,
}

export interface UserPatchV2 {
  displayName: string,
  contactEmail: string,
  analysisServerUsername: string,
}

export interface UserRoleRecordPrivilegePost {
  owningTenantGlobalId: string,
  assigneeGlobalId: string,
  roleGlobalId: string,
}
