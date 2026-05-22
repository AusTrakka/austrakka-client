export enum RoleName {
  TrakkaAdmin = 'TrakkaAdmin',
  ProFormaEditor = 'ProFormaEditor',
  GroupViewer = 'GroupViewer',
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
  Viewer = 'Viewer',
  GuestViewer = 'GuestViewer',
  ProjectContributor = 'ProjectContributor',
  Contributor = 'Contributor',
}

export const orgRoles = [RoleName.GroupViewer, RoleName.SeqViewer, RoleName.Uploader];

export const projectRoles = [
  RoleName.GroupViewer,
  RoleName.SeqViewer,
  RoleName.Uploader,
  RoleName.ProjectAnalyst,
];
