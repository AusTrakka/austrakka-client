import {
  callDELETE,
  callGET,
  callPATCH,
  callPost,
  callPOSTForm,
  callPUT,
  callSimpleGET,
  downloadFile,
} from './api';
import { Feedback, FeedbackPost, UserPatchV2, UserRoleRecordPrivilegePost } from '../types/dtos';
import { ResponseObject } from '../types/responseObject.interface';

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
// if the condition is custom, then the value is going to be a string boolean
// and we don't need to do anything
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
export const getProjectDashboard = (projectAbbrev: string, token: string) => callGET(`/api/Projects/assigned-dashboard/${projectAbbrev}`, token);

// User dashboard endpoints
export const getUserDashboardOverview = (token: string, searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/overview?filters=${searchParams}`, token);
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
export const getOrganisations = (includeAll: boolean, token: string) => callGET(`/api/Organisations?includeall=${includeAll}`, token);

export const postFeedback = (feedbackPostDto: FeedbackPost, token: string): Promise<ResponseObject<Feedback>> => callPost<Feedback>('/api/Feedback', token, feedbackPostDto);

// PermissionV2 endpoints
// Tenant
export const getTenant = (token: string) => callGET('/api/V2/Tenant/Default', token);

export const postTenantPrivilege = (
  tenantGlobalId: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token: string,
) => callPost(`/api/V2/Tenant/${tenantGlobalId}/Privilege`, token, privilegeBody);

export const deleteTenantPrivilege = (
  tenantGlobalId: string,
  privilegeGlobalId: string,
  defaultTenantGlobalId: string,
  token:string,
) =>
  callDELETE(
    `/api/V2/Tenant/${tenantGlobalId}/Privilege/${privilegeGlobalId}?owningTenantGlobalId=${defaultTenantGlobalId}`,
    token,
  );

// User
export const getMeV2 = (owningTenantGlobalId: string, token: string) => callGET(`/api/V2/Tenant/${owningTenantGlobalId}/User/Me`, token);
export const getUserListV2 = (
  includeAll: boolean,
  owningTenantGlobalId: string,
  token: string,
) => callGET(`/api/V2/Tenant/${owningTenantGlobalId}/Users?includeall=${includeAll}`, token);

export const getUserV2 = (
  userGlobalId: string,
  owningTenantGlobalId: string,
  token: string,
) => callGET(`/api/V2/UserV2/${userGlobalId}?owningTenantGlobalId=${owningTenantGlobalId}`, token);

export const patchUserV2 = (
  userGlobalId: string,
  userPatchDto: UserPatchV2,
  owningTenantGlobalId: string,
  token: string,
) => callPATCH(
  `/api/V2/UserV2/${userGlobalId}?owningTenantGlobalId=${owningTenantGlobalId}`,
  token,
  userPatchDto,
);

export const disableUserV2 = (
  userGlobalId: string,
  owningTenantGlobalId: string,
  token: string,
) => callPATCH(
  `/api/V2/UserV2/disable/${userGlobalId}?owningTenantGlobalId=${owningTenantGlobalId}`,
  token,
);

export const enableUserV2 = (
  userGlobalId: string,
  owningTenantGlobalId: string,
  token: string,
) => callPATCH(
  `/api/V2/UserV2/enable/${userGlobalId}?owningTenantGlobalId=${owningTenantGlobalId}`,
  token,
);

// OrganisationV2

export const getOrganisationsV2 = (
  organisationGlobalId: string,
  token: string,
) => callGET(`/api/V2/OrganisationV2/${organisationGlobalId}`, token);

export const patchUserOrganisationV2 = (
  userGlobalId: string,
  organisationGlobalId: string,
  targetOrgGlobalId: string,
  owningTenantGlobalId: string,
  token: string,
) => callPATCH(
  `/api/V2/OrganisationV2/${organisationGlobalId}/User/${userGlobalId}?owningTenantGlobalId=${owningTenantGlobalId}`,
  token,
  targetOrgGlobalId,
);

export const postOrgPrivilege = (
  recordGlobalId: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token:string,
) => callPost(`/api/V2/OrganisationV2/${recordGlobalId}/Privilege`, token, privilegeBody);

export const deleteOrgPrivilege = (
  recordGlobalId: string,
  privilegeGlobalId: string,
  defaultTenantGlobalId: string,
  token:string,
) => callDELETE(
  `/api/V2/OrganisationV2/${recordGlobalId}/Privilege/${privilegeGlobalId}/?owningTenantGlobalId=${defaultTenantGlobalId}`,
  token,
);

// Tenant
export const getFieldsV2 = (
  tenantGlobalId: string,
  token: string,
) =>
  callGET(`/api/V2/Tenant/${tenantGlobalId}/MetaDataColumn`, token);
export const patchFieldV2 = (
  tenantGlobalId: string,
  metaDataColumnName: string,
  token: string,
  field: any,
) =>
  callPATCH(`/api/V2/Tenant/${tenantGlobalId}/MetaDataColumn/${metaDataColumnName}`, token, field);
