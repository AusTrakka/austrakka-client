// These are view models; should correspond to server-side DTO.
export interface Project {
  projectId: number;
  globalId: string;
  abbreviation: string;
  name: string;
  label: string;
  clientType: string;
  description: string;
  projectMembers: {
    id: number;
    name: string;
  };
  trees: {
    id: number;
    name: string;
  }[];
  isActive: boolean;
  groupName: string;
  created: Date;
  mergeAlgorithm: string;
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

// this is a common interface representing metadata fields,
export interface PlotListing {
  plotId: number;
  abbreviation: string;
  name: string;
  description: string;
  plotType: string;
  projectId: number;
  // also projectName, and isActive. projectAbbrev??
}

// may need to add the property position here perchance
export interface Member {
  username: string;
  roles: string[];
  position: string;
  organization: {
    id: number;
    abbreviation: string;
  };
  displayName: string;
  contactEmail: string;
}

export interface User {
  objectId: string;
  username: string;
  globalId: string;
  isActive: boolean;
  orgAbbrev: string;
  orgName: string;
  orgGlobalId: string;
  isAusTrakkaAdmin: boolean;
  groupRoles: GroupRole[];
  displayName: string;
  position: string;
  created: Date;
  lastLogIn: Date;
  lastActive: Date;
  contactEmail: string;
  IsAusTrakkaProcess: boolean;
  analysisServerUsername: string;
  privileges: GroupedPrivilegesByRecordType[];
  monthlyBytesUsed: number;
  monthlyBytesQuota: number;
  noDownloadQuota: boolean;
}

export interface UserMe {
  objectId: string;
  username: string;
  displayName: string;
  contactEmail: string;
  position: string;
  orgGlobalId: string;
  orgId: number;
  orgAbbrev: string;
  orgName: string;
  analysisServerUsername: string;
  lastDownloadDate: Date;
  monthlyBytesUsed: number;
  monthlyBytesQuota: number;
  scopes: GroupedPrivilegesByRecordTypeWithScopes[];
  groupRoles: GroupRole[];
  isAusTrakkaAdmin: boolean;
}

export interface GroupedPrivilegesByRecordTypeWithScopes {
  recordType: string;
  recordRoles: PrivilegeWithRolesWithScopes[];
}

export interface PrivilegeWithRolesWithScopes {
  recordName: string;
  recordGlobalId: string;
  roles: RecordRoleWithScopes[];
}

export interface RecordRoleWithScopes {
  roleName: string;
  privilegeLevel: string;
  privilegeGlobalId: string;
  scopes: string[];
}

export interface GroupedPrivilegesByRecordType {
  recordType: string;
  recordRoles: PrivilegeWithRoles[];
}

export interface PrivilegeWithRoles {
  recordName: string;
  recordGlobalId: string;
  roles: RecordRole[];
}

export interface RecordRole {
  roleName: string;
  privilegeGlobalId?: string;
}

export interface UserList {
  name: string;
  id: string;
  globalId: string;
  organisation: string;
  contactEmail: string;
  isActive: boolean;
  created: string;
  createdBy: string;
  lastLogIn: Date;
  lastActive: Date;
  isAusTrakkaAdmin: boolean;
  isAusTrakkaProcess: boolean;
  username: string;
}

export interface MetaDataColumnMapping {
  metaDataColumnMappingId: number;
  metaDataColumnName: string;
  metaDataColumnPrimitiveType: string;
  metaDataColumnValidValues: string[];
  isRequired: boolean;
  isDispalyedByDefault: boolean;
  isActive: boolean;
  canVisualise: boolean;
}

// INFO: this is a common interface representing metadata fields and general table fields,
// with information about types and display order
export interface Field {
  columnName: string;
  primitiveType: string | null;
  metaDataColumnTypeName: string;
  metaDataColumnValidValues: string[] | null;
  canVisualise: boolean;
  geoField: boolean;
  columnOrder: number;
}

// Not a DTO: represents a field deduced from uploaded data
export interface DeducedField extends Field {
  displayedFieldType: string;
  fieldTypeSource: string;
}

// This represents the ProjectFieldDTO, with nested analysisLabels
// It is appropriate for use in project management interfaces
// It is not appropriate for representing the columns that will be found in a project view
export interface ProjectField {
  projectFieldId: number;
  fieldName: string;
  primitiveType: string | null;
  metaDataColumnTypeName: string;
  fieldSource: string;
  columnOrder: number;
  canVisualise: boolean;
  geoField: boolean;
  hidden: boolean;
  metaDataColumnValidValues: string[] | null;
  analysisLabels: string[];
  createdBy: string;
}

// This is not a DTO, but a calculated field representing a column found in a project view
// The projectFieldId and projectFieldName will not be unique
// The columnName is formed from the projectFieldName and the analysisLabel
export interface ProjectViewField extends Field {
  columnName: string;
  projectFieldId: number;
  projectFieldName: string;
  primitiveType: string | null;
  metaDataColumnTypeName: string;
  fieldSource: string;
  columnOrder: number;
  canVisualise: boolean;
  geoField: boolean;
  hidden: boolean;
  metaDataColumnValidValues: string[] | null;
}

export interface ProjectView {
  id: number;
  fileName: string;
  blobFilePath: string;
  originalFileName: string;
  isBase: boolean;
  fields: string[];
  viewFields: string[]; // this is currently calculated client-side
}
