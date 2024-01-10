import { callGET, callPOSTForm, downloadFile } from './api';

// Definition of endpoints
export const getProFormaDownload = async (abbrev: string, id: number | null, token: string) => {
  const response = id != null ? await downloadFile(`/api/ProFormas/download/proforma/${abbrev}?proformaVersionId=${id}`, token)
    : await downloadFile(`/api/ProFormas/download/proforma/${abbrev}`, token);
  return response;
};

export const getSampleGroups = (sampleName:string, token: string) => callGET(`/api/Sample/${sampleName}/Groups`, token);
export const getProjectList = (token: string) => callGET('/api/Projects?&includeall=false', token);
export const getProjectDetails = (abbrev: string, token: string) => callGET(`/api/Projects/abbrev/${abbrev}`, token);
export const getGroupList = (token: string) => callGET('/api/Group', token);
export const getUserGroups = (token: string) => callGET('/api/Users/Me', token);
export const getPlots = (projectId: number, token: string) => callGET(`/api/Plots/project/${projectId}`, token);
export const getPlotDetails = (abbrev: string, token: string) => callGET(`/api/Plots/abbrev/${abbrev}`, token);
export const getMetadata = (groupId: number, fields: string[], token: string) => {
  const fieldsQuery: string = fields.map((field) => `fields=${field}`).join('&');
  return callGET(`/api/MetadataSearch/by-field/?groupContext=${groupId}&${fieldsQuery}`, token);
};
export const getTrees = (projectAbbrev: string, token: string) => callGET(`/api/Analyses/project/${projectAbbrev}`, token);
export const getTreeData = (jobInstanceId: number, token: string) => callGET(`/api/JobInstance/${jobInstanceId}`, token);
export const getLatestTreeData = (analysisId: number, token: string) => callGET(`/api/JobInstance/${analysisId}/LatestVersion`, token);
export const getTreeVersions = (analysisId: number, token: string) => callGET(`/api/JobInstance/${analysisId}/AllVersions`, token);
export const getTreeMetaData = (analysisId: number, jobInstanceId: number, token: string) => callGET(`/api/analysisResults/${analysisId}/metadata/${jobInstanceId}`, token);
export const getSamples = (token: string, groupId: number, searchParams?: URLSearchParams) => {
  if (!searchParams) return callGET(`/api/MetadataSearch?groupContext=${groupId}`, token);
  searchParams.append('groupContext', String(groupId));
  return callGET(`/api/MetadataSearch?${searchParams}`, token);
};
export const getTotalSamples = (groupId: number, token: string) => callGET(`/api/MetadataSearch/?groupContext=${groupId}&pageSize=1&page=1`, token);
export const getDisplayFields = (groupId: number, token: string) => callGET(`/api/Group/display-fields?groupContext=${groupId}`, token);
export const getGroupMembers = (groupId: number, token: string) => callGET(`/api/Group/Members?groupContext=${groupId}`, token);
export const getGroupProFormaVersions = (groupId: number, token: string) => callGET(`/api/ProFormas/GroupVersionInformation?groupContext=${groupId}`, token);
export const getUserProformas = (token: string) => callGET('/api/Proformas', token);
export const getProformaDetails = (proFormaAbbrev: string, token: string) => callGET(`/api/ProFormas/abbrev/${proFormaAbbrev}`, token);
export const getProformaVersions = (proFormaAbbrev: string, token: string) => callGET(`/api/ProFormas/abbrev/${proFormaAbbrev}/versions`, token);

// Project dashboards endpoints
export const getProjectDashboard = (projectId: number, token: string) => callGET(`/api/Projects/assigned-dashboard/${projectId}`, token);
export const getProjectDashboardOveriew = (groupId: number, token: string, searchParams?: string) => callGET(`/api/DashboardSearch/project-dashboard/overview/?groupContext=${groupId}&filters=${searchParams}`, token);
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

// User dashboard endpoints
export const getUserDashboardOveriew = (token: string, searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/overview?filters=${searchParams}`, token);
export const getUserDashboardProjects = (token: string, searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/projects-total?filters=${searchParams}`, token);
export const getUserDashboardPhessStatus = (token: string, searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/phess-status?filters=${searchParams}`, token);

export const validateSubmissions = (formData: FormData, params: string, token: string) => callPOSTForm(`/api/Submissions/ValidateSubmissions${params}`, formData, token);
export const uploadSubmissions = (formData: FormData, params: string, token: string) => callPOSTForm(`/api/Submissions/UploadSubmissions${params}`, formData, token);
export const getUser = (userObjectId: string, token: string) => callGET(`/api/Users/userId/${userObjectId}`, token);
