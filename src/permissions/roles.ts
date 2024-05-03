
export enum RoleName {
  AusTrakkaAdmin = 'AusTrakkaAdmin',
  ProFormaEditor = 'ProFormaEditor',
  Viewer = 'Viewer',
  SeqViewer = 'SeqViewer',
  Uploader = 'Uploader',
  ProjectAnalyst = 'ProjectAnalyst',
  ResultWriter = 'ResultWriter',
};

// This information should perhaps be moved to server-side

export const austrakkaRoles = [
  RoleName.AusTrakkaAdmin,
  RoleName.ProFormaEditor,
];

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
  RoleName.ResultWriter,
];
