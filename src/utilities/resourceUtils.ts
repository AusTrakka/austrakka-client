import { callGET, callPATCH, callPOSTForm, callPUT, callSimpleGET, downloadFile } from './api';

// Definition of endpoints

// Project endpoints
export const getProjectList = (token: string) => callGET('/api/Projects?&includeall=false', token);
export const getProjectDetails = (abbrev: string, token: string) => callGET(`/api/Projects/abbrev/${abbrev}`, token);

// Plots endpoints
export const getPlots = (projectId: number, token: string) => callGET(`/api/Plots/project/${projectId}`, token);
export const getPlotDetails = (abbrev: string, token: string) => callGET(`/api/Plots/abbrev/${abbrev}`, token);

// Analysis endpoints
export const getTrees = (projectAbbrev: string, includeAll: boolean, token: string) => callGET(`/api/Analyses/project/${projectAbbrev}?includeall=${includeAll}`, token);
export const getTreeData = (jobInstanceId: number, token: string) => callGET(`/api/JobInstance/${jobInstanceId}`, token);
export const getLatestTreeData = (analysisId: number, token: string) => callGET(`/api/JobInstance/${analysisId}/LatestVersion`, token);
export const getTreeVersions = (analysisId: number, token: string) => callGET(`/api/JobInstance/${analysisId}/AllVersions`, token);

// Metadata endpoints
export const getMetadata = (groupId: number, fields: string[], token: string) => {
  const fieldsQuery: string = fields.map((field) => `fields=${field}`).join('&');
  return callGET(`/api/MetadataSearch/by-field/?groupContext=${groupId}&${fieldsQuery}`, token);
};
export const getSamples = (token: string, groupId: number, searchParams?: URLSearchParams) => {
  if (!searchParams) return callGET(`/api/MetadataSearch?groupContext=${groupId}`, token);
  searchParams.append('groupContext', String(groupId));
  return callGET(`/api/MetadataSearch?${searchParams}`, token);
};
export const getTotalSamples = (groupId: number, token: string) => callGET(`/api/MetadataSearch/?groupContext=${groupId}&pageSize=1&page=1`, token);

// Group endpoints
export const getDisplayFields = (groupId: number, token: string) => callGET(`/api/Group/display-fields?groupContext=${groupId}`, token);
export const getGroupMembers = (groupId: number, token: string) => callGET(`/api/Group/Members?groupContext=${groupId}`, token);
export const getGroupList = (token: string) => callGET('/api/Group', token);
export const replaceAssignments = (userId: string, token: string, assignments: any) => callPUT(`/api/Group/replace-assignments/${userId}`, token, assignments);

// Proforma and field endpoints
export const getGroupProFormaVersions = (groupId: number, token: string) => callGET(`/api/ProFormas/GroupVersionInformation?groupContext=${groupId}`, token);
export const getUserProformas = (token: string) => callGET('/api/Proformas', token);
export const getProformaDetails = (proFormaAbbrev: string, token: string) => callGET(`/api/ProFormas/abbrev/${proFormaAbbrev}`, token);
export const getProformaVersions = (proFormaAbbrev: string, token: string) => callGET(`/api/ProFormas/abbrev/${proFormaAbbrev}/versions`, token);
export const getProFormaDownload = async (abbrev: string, id: number | null, token: string) => {
  const response = id != null ? await downloadFile(`/api/ProFormas/download/proforma/${abbrev}?proformaVersionId=${id}`, token)
    : await downloadFile(`/api/ProFormas/download/proforma/${abbrev}`, token);
  return response;
};
export const getFields = (token: string) => callGET('/api/MetaDataColumns', token);
export const patchField = (fieldId: number, token: string, field: any) => callPATCH(`/api/MetaDataColumns/${fieldId}`, token, field);

// Project metadata
export const getProjectSettings = (projectAbbrev: string, token: string) => callGET(`/api/Projects/${projectAbbrev}/project-settings`, token);
export const getProjectFields = (projectAbbrev: string, token: string) => callGET(`/api/Projects/${projectAbbrev}/project-field-list`, token);
export const getProjectViews = (projectAbbrev: string, token: string) => callGET(`/api/Projects/${projectAbbrev}/project-views`, token);
export const getProjectViewData = (projectAbbrev: string, viewId: number, token: string) => callSimpleGET(`/api/Projects/${projectAbbrev}/download-project-view?datasetViewId=${viewId}`, token);

// Project dashboards endpoints
export const getProjectDashboard = (projectId: number, token: string) => callGET(`/api/Projects/assigned-dashboard/${projectId}`, token);
export const getProjectDashboardOveriew = (groupId: number, token: string, searchParams?: string) => callGET(`/api/DashboardSearch/project-dashboard/overview/?groupContext=${groupId}&filters=${searchParams}`, token);

// User dashboard endpoints
export const getDashboardFields = (
  groupId: number,
  token: string,
  fields: string[],
  searchParams?: string,
) => {
  const fieldsQuery: string = fields.map((field) => `fields=${field}`).join('&');
  return callGET(`/api/DashboardSearch/project-dashboard/select-fields-by-date?groupContext=${groupId}&${fieldsQuery}&filters=${searchParams}`, token);
};
export const getThresholdAlerts = (groupId: number, alertField: string, token: string) => callGET(`/api/DashboardSearch/project-dashboard/threshold-alerts?groupContext=${groupId}&alertField=${alertField}`, token);
export const getUserDashboardOveriew = (token: string, searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/overview?filters=${searchParams}`, token);
export const getUserDashboardProjects = (token: string, searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/projects-total?filters=${searchParams}`, token);
export const getUserDashboardPhessStatus = (token: string, searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/phess-status?filters=${searchParams}`, token);

// Submission endpoints
export const validateSubmissions = (formData: FormData, params: string, token: string) => callPOSTForm(`/api/Submissions/ValidateSubmissions${params}`, formData, token);
export const uploadSubmissions = (formData: FormData, params: string, token: string) => callPOSTForm(`/api/Submissions/UploadSubmissions${params}`, formData, token);

// User endpoints
export const getMe = (token: string) => callGET('/api/Users/Me', token);
export const getUser = (userObjectId: string, token: string) => callGET(`/api/Users/userId/${userObjectId}`, token);
export const getUserList = (includeAll: boolean, token: string) => callGET(`/api/Users?includeall=${includeAll}`, token);
export const patchUserContactEmail = (userObjectId: string, token: string, email: any) => callPATCH(`/api/Users/${userObjectId}/contactEmail`, token, email);
export const putUser = (userObjectId: string, token: string, user: any) => callPUT(`/api/Users/${userObjectId}`, token, user);

// Role endpoints
export const getRoles = (token: string) => callGET('/api/Roles', token);

// Dataset endpoints
export const getDatasets = (projectAbbrev: string, token: string) => callGET(`/api/Projects/${projectAbbrev}/active-dataset-entry-list`, token);
export const disableDataset = (projectAbbrev: string, datasetId: number, token: string) => callPATCH(`/api/Projects/${projectAbbrev}/disable-dataset/${datasetId}`, token);

// Sample endpoints
export const getSampleGroups = (sampleName:string, token: string) => callGET(`/api/Sample/${sampleName}/Groups`, token);

// Organisation endpoints
export const getOrgansations = (includeAll: boolean, token: string) => callGET(`/api/Organisations?includeall=${includeAll}`, token);
