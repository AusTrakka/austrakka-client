export enum RoleName {
  AusTrakkaAdmin = 'AusTrakkaAdmin',
  ProFormaEditor = 'ProFormaEditor',
  Viewer = 'Viewer',
  SeqViewer = 'SeqViewer',
  Uploader = 'Uploader',
  ProjectAnalyst = 'ProjectAnalyst',
}

// WARN: might be missing some here
export enum RoleV2SeededName {
  SuperUser = 'SuperUser',
  User = 'User',
  Admin = 'Admin',
  ProjectAnalyst = 'ProjectAnalyst',
  ProjectViewer = 'ProjectViewer',
  OrgViewer = 'OrgViewer',
  GuestViewer = 'GuestViewer',
  ProjectContributor = 'ProjectContributor',
  GuestUploader = 'GuestUploader',
}

export const orgRoles = [
  RoleName.Viewer,
  RoleName.SeqViewer,
  RoleName.Uploader,
];

export const projectRoles = [
  RoleName.Viewer,
  RoleName.SeqViewer,
  RoleName.Uploader,
  RoleName.ProjectAnalyst,
];
