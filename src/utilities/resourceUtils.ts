/* eslint-disable @typescript-eslint/indent */
// ^ rule is broken for some typescript-specific syntax features
import {
  callDELETE,
  buildUploadHeaders,
  callGET,
  callPATCH,
  callPost,
  callPOSTForm,
  callPostMultipart,
  callPUT,
  callSimpleGET,
  downloadFile,
} from './api';
import {
  Feedback,
  FeedbackPost,
  Plot,
  PlotListing,
  Organisation,
  Project,
  ProjectSummary,
  Tree,
  TreeVersion,
  UserPatchV2,
  UserRoleRecordPrivilegePost,
} from '../types/dtos';
import { ResponseObject } from '../types/responseObject.interface';

// Definition of endpoints

// Project endpoints
export const getProjectList = (token: string):
  Promise<ResponseObject<Project[]>> => callGET('/api/Projects?&includeall=false', token);
export const getProjectDetails = (abbrev: string, token: string):
  Promise<ResponseObject<Project>> => callGET(`/api/Projects/abbrev/${abbrev}`, token);

// Plots endpoints
export const getPlots = (projectId: number, token: string):
  Promise<ResponseObject<PlotListing[]>> => callGET(`/api/Plots/project/${projectId}`, token);
export const getPlotDetails = (abbrev: string, token: string):
  Promise<ResponseObject<Plot>> => callGET(`/api/Plots/abbrev/${abbrev}`, token);

// Tree endpoints
export const getTrees = (projectAbbrev: string, includeAll: boolean, token: string):
  Promise<ResponseObject<Tree[]>> => callGET(`/api/Trees/project/${projectAbbrev}?includeall=${includeAll}`, token);
export const getTreeData = (treeVersionId: number, token: string):
  Promise<ResponseObject<TreeVersion>> => callGET(`/api/TreeVersion/${treeVersionId}`, token);
export const getLatestTreeData = (treeId: number, token: string):
  Promise<ResponseObject<TreeVersion>> => callGET(`/api/TreeVersion/${treeId}/LatestVersion`, token);
export const getTreeVersions = (treeId: number, token: string):
  Promise<ResponseObject<TreeVersion[]>> => callGET(`/api/TreeVersion/${treeId}/AllVersions`, token);

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

// Project metadata
export const getProjectSettings = (projectAbbrev: string, token: string) => callGET(`/api/Projects/${projectAbbrev}/project-settings`, token);
export const getProjectFields = (projectAbbrev: string, token: string) => callGET(`/api/Projects/${projectAbbrev}/project-field-list`, token);
export const getProjectViews = (projectAbbrev: string, token: string) => callGET(`/api/Projects/${projectAbbrev}/project-views`, token);
export const getProjectViewData = (projectAbbrev: string, viewId: number, token: string) => callSimpleGET(`/api/Projects/${projectAbbrev}/download-project-view?datasetViewId=${viewId}`, token);

// Project dashboards endpoints
export const getProjectDashboard = (projectAbbrev: string, token: string) => callGET(`/api/Projects/assigned-dashboard/${projectAbbrev}`, token);

// User dashboard endpoints
export const getUserDashboardOverview = (token: string) => callGET('/api/DashboardSearch/user-dashboard/overview', token);

// has to be split to 3 different lines as it was getting too long
export const getUserDashboardProjects =
  (token: string): Promise<ResponseObject<ProjectSummary[]>> =>
    callGET('/api/DashboardSearch/user-dashboard/projects-total', token);

// Submission endpoints
export const validateSubmissions = (
  formData: FormData,
  params: string,
  token: string,
  ownerOrgAbbrev: string,
  shareProjectAbbrevs: string[] = [],
) => {
  const customHeaders = buildUploadHeaders(ownerOrgAbbrev, shareProjectAbbrevs);
  return callPOSTForm(`/api/Submissions/ValidateSubmissions${params}`, formData, token, customHeaders);
};
export const uploadSubmissions = (
  formData: FormData,
  params: string,
  token: string,
  ownerOrgAbbrev: string,
  shareProjectAbbrevs: string[] = [],
) => {
  const customHeaders = buildUploadHeaders(ownerOrgAbbrev, shareProjectAbbrevs);
  return callPOSTForm(`/api/Submissions/UploadSubmissions${params}`, formData, token, customHeaders);
};

// Sequence endpoints
// TODO: this should parse the response
export const uploadFastqSequence = (formData: FormData, params: string, token: string, headers: any) => callPostMultipart(`/api/Sequence${params}`, formData, token, headers);

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
export const getSampleGroups = (sampleName: string, token: string) => callGET(`/api/Sample/${sampleName}/Groups`, token);

// Organisation endpoints
export const getOrganisations = (includeAll: boolean, token: string) => callGET(`/api/Organisations?includeall=${includeAll}`, token);
export const getOrganisation = (abbrev: string, token: string): Promise<ResponseObject<Organisation>> => callGET(`/api/Organisations/${abbrev}`, token);

export const postFeedback = (feedbackPostDto: FeedbackPost, token: string): Promise<ResponseObject<Feedback>> => callPost<Feedback>('/api/Feedback', token, feedbackPostDto);

// PermissionV2 endpoints
export const postTenantPrivilege = (
  _: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token: string,
) => callPost('/api/Tenant/Privilege', token, privilegeBody);

export const deleteTenantPrivilege = (
  _: string,
  privilegeGlobalId: string,
  token: string,
) =>
  callDELETE(
    `/api/Tenant/Privilege/${privilegeGlobalId}`,
    token,
  );

// User
export const getMeV2 = (token: string) => callGET('/api/UserV2/Me', token);
export const getUserListV2 = (
  includeAll: boolean,
  token: string,
) => callGET(`/api/UserV2?includeall=${includeAll}`, token);

export const getUserV2 = (
  userGlobalId: string,
  token: string,
) => callGET(`/api/UserV2/${userGlobalId}`, token);

export const patchUserV2 = (
  userGlobalId: string,
  userPatchDto: UserPatchV2,
  token: string,
) => callPATCH(
  `/api/UserV2/${userGlobalId}`,
  token,
  userPatchDto,
);

export const disableUserV2 = (
  userGlobalId: string,
  token: string,
) => callPATCH(
  `/api/UserV2/disable/${userGlobalId}`,
  token,
);

export const enableUserV2 = (
  userGlobalId: string,
  token: string,
) => callPATCH(
  `/api/UserV2/enable/${userGlobalId}`,
  token,
);

// OrganisationV2

export const getOrganisationsV2 = (
  organisationGlobalId: string,
  token: string,
) => callGET(`/api/OrganisationV2/${organisationGlobalId}`, token);

export const patchUserOrganisationV2 = (
  userGlobalId: string,
  organisationGlobalId: string,
  targetOrgGlobalId: string,
  token: string,
) => callPATCH(
  `/api/OrganisationV2/${organisationGlobalId}/User/${userGlobalId}`,
  token,
  targetOrgGlobalId,
);

export const postOrgPrivilege = (
  recordGlobalId: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token: string,
) => callPost(`/api/OrganisationV2/${recordGlobalId}/Privilege`, token, privilegeBody);

export const deleteOrgPrivilege = (
  recordGlobalId: string,
  privilegeGlobalId: string,
  token: string,
) => callDELETE(
  `/api/OrganisationV2/${recordGlobalId}/Privilege/${privilegeGlobalId}`,
  token,
);

// Tenant
export const getFieldsV2 = (
  token: string,
) =>
  callGET('/api/MetaDataColumnsV2', token);
export const patchFieldV2 = (
  metaDataColumnName: string,
  token: string,
  field: any,
) =>
  callPATCH(`/api/MetaDataColumnsV2/${metaDataColumnName}`, token, field);
