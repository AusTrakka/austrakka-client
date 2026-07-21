import RecordTypes from '../constants/record-type.enum';
import type {
  CreateMsg,
  DerivedLog,
  FeedbackPost,
  MetaDataColumn,
  Organisation,
  Plot,
  PlotListing,
  Project,
  ProjectDashboardDetails,
  ProjectDocument,
  ProjectPut,
  ProjectSummary,
  ProjectView,
  Role,
  Tree,
  TreeVersion,
  UserPatchV2,
  UserRoleRecordPrivilegePost,
} from '../types/dtos';
import type { ResponseObject } from '../types/responseObject.interface';
import type { Sample } from '../types/sample.interface';
import {
  buildDocumentUploadHeaders,
  buildUploadHeaders,
  callDELETE,
  callGET,
  callPATCH,
  callPOSTForm,
  callPost,
  callPostMultipart,
  callPUT,
  callSimpleGET,
  downloadFile,
  previewFile,
} from './api';

// Definition of endpoints

// Project endpoints
export const getProjectList = (token: string): Promise<ResponseObject<Project[]>> =>
  callGET('/api/Projects', token);
export const getProjectDetails = (
  abbrev: string,
  token: string,
): Promise<ResponseObject<Project>> => callGET(`/api/Projects/${abbrev}`, token);

export const putProjectDetails = (
  identifer: string,
  putDto: ProjectPut,
  token: string,
): Promise<ResponseObject<Project>> => callPUT(`/api/Projects/${identifer}`, token, putDto);

export const pathchProjectIsActive = (
  isActive: boolean,
  identifier: string,
  token: string,
): Promise<ResponseObject> => {
  if (isActive) {
    return callPATCH(`/api/Projects/${identifier}/Enable`, token);
  } else {
    return callPATCH(`/api/Projects/${identifier}/Disable`, token);
  }
};

export const getProjectMembers = (identifier: string, token: string) =>
  callGET(`/api/Projects/${identifier}/Members`, token);

// Plots endpoints
export const getPlots = (
  projectId: number,
  token: string,
): Promise<ResponseObject<PlotListing[]>> => callGET(`/api/Plots/project/${projectId}`, token);
export const getPlotDetails = (abbrev: string, token: string): Promise<ResponseObject<Plot>> =>
  callGET(`/api/Plots/abbrev/${abbrev}`, token);

// Tree endpoints
export const getTrees = (
  projectAbbrev: string,
  includeAll: boolean,
  token: string,
): Promise<ResponseObject<Tree[]>> =>
  callGET(`/api/Trees/project/${projectAbbrev}?includeall=${includeAll}`, token);
export const getTreeData = (
  treeVersionId: number,
  token: string,
): Promise<ResponseObject<TreeVersion>> => callGET(`/api/TreeVersion/${treeVersionId}`, token);
export const getLatestTreeData = (
  treeId: number,
  token: string,
): Promise<ResponseObject<TreeVersion>> =>
  callGET(`/api/TreeVersion/${treeId}/LatestVersion`, token);
export const getTreeVersions = (
  treeId: number,
  token: string,
): Promise<ResponseObject<TreeVersion[]>> =>
  callGET(`/api/TreeVersion/${treeId}/AllVersions`, token);

// Proforma and field endpoints
// if the condition is custom, then the value is going to be a string boolean
// and we don't need to do anything
export const getGroupProFormaVersions = (groupId: number, token: string) =>
  callGET(`/api/ProFormas/GroupVersionInformation?groupContext=${groupId}`, token);
export const getUserProformas = (token: string) => callGET('/api/Proformas', token);
export const getProformaDetails = (proFormaAbbrev: string, token: string) =>
  callGET(`/api/ProFormas/abbrev/${proFormaAbbrev}`, token);
export const getProformaVersions = (proFormaAbbrev: string, token: string) =>
  callGET(`/api/ProFormas/abbrev/${proFormaAbbrev}/versions`, token);
export const getProFormaDownload = async (abbrev: string, id: number | null, token: string) => {
  const response =
    id != null
      ? await downloadFile(
          `/api/ProFormas/download/proforma/${abbrev}?proformaVersionId=${id}`,
          token,
        )
      : await downloadFile(`/api/ProFormas/download/proforma/${abbrev}`, token);
  return response;
};
export const getProformaGroups = (proFormaAbbrev: string, token: string) =>
  callGET(`/api/ProFormas/${proFormaAbbrev}/listgroups`, token);

// Project metadata
export const getProjectFields = (projectAbbrev: string, token: string) =>
  callGET(`/api/Projects/${projectAbbrev}/project-field-list`, token);

export const getProjectView = (
  projectAbbrev: string,
  token: string,
): Promise<ResponseObject<ProjectView>> =>
  callGET(`/api/Projects/${projectAbbrev}/project-views`, token);

export const getProjectViewData = (projectAbbrev: string, token: string): Promise<Response> =>
  callSimpleGET(`/api/Projects/${projectAbbrev}/download-project-view?datasetViewId`, token);

// Project dashboards endpoints
export const getProjectDashboard = (projectAbbrev: string, token: string) =>
  callGET(`/api/Projects/assigned-dashboard/${projectAbbrev}`, token);

export const getAvailableProjectDashboards = (
  token: string,
): Promise<ResponseObject<ProjectDashboardDetails[]>> => callGET('/api/ProjectDashboards', token);

// User dashboard endpoints
export const getUserDashboardOverview = (token: string) =>
  callGET('/api/DashboardSearch/user-dashboard/overview', token);

// has to be split to 3 different lines as it was getting too long
export const getUserDashboardProjects = (
  token: string,
): Promise<ResponseObject<ProjectSummary[]>> =>
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
  return callPOSTForm(
    `/api/Submissions/ValidateSubmissions${params}`,
    formData,
    token,
    customHeaders,
  );
};
export const uploadSubmissions = (
  formData: FormData,
  params: string,
  token: string,
  ownerOrgAbbrev: string,
  shareProjectAbbrevs: string[] = [],
) => {
  const customHeaders = buildUploadHeaders(ownerOrgAbbrev, shareProjectAbbrevs);
  return callPOSTForm(
    `/api/Submissions/UploadSubmissions${params}`,
    formData,
    token,
    customHeaders,
  );
};
export const createSample = (
  token: string,
  name: string,
  owner: string,
  sharedProjects: string[] = [],
  clientSessionId?: string,
) => callPost('/api/Sample', token, { name, owner, sharedProjects }, clientSessionId);

// Sequence endpoints
// TODO: this should parse the response
export const uploadSequence = (
  formData: FormData,
  params: string,
  token: string,
  headers: any,
  clientSessionId?: string,
) => callPostMultipart(`/api/Sequence${params}`, formData, token, headers, clientSessionId);

// User endpoints
export const getMe = (token: string) => callGET('/api/Users/Me', token);
export const getUser = (identifier: string, token: string) =>
  callGET(`/api/Users/${identifier}`, token);
export const getUserList = (includeAll: boolean, token: string) =>
  callGET(`/api/Users?includeall=${includeAll}`, token);

// Role endpoints
export const getRoles = (token: string): Promise<ResponseObject<Role[]>> =>
  callGET('/api/RolesV2', token);

// Dataset endpoints
export const getDatasets = (projectAbbrev: string, token: string) =>
  callGET(`/api/Projects/${projectAbbrev}/active-dataset-entry-list`, token);
export const disableDataset = (projectAbbrev: string, datasetId: number, token: string) =>
  callPATCH(`/api/Projects/${projectAbbrev}/disable-dataset/${datasetId}`, token);

// Sample endpoints
export const getSampleGroups = (sampleName: string, token: string) =>
  callGET(`/api/Sample/${sampleName}/Groups`, token);
export const shareSamples = (
  token: string,
  groupName: string,
  samples: string[],
  clientSessionId?: string,
) =>
  callPATCH('/api/Sample/Share', token, { groupName: groupName, seqIds: samples }, clientSessionId);
export const unshareSamples = (
  token: string,
  groupName: string,
  samples: string[],
  clientSessionId?: string,
) =>
  callPATCH(
    '/api/Sample/UnShare',
    token,
    { groupName: groupName, seqIds: samples },
    clientSessionId,
  );

// Organisation endpoints
export const getOrganisations = (
  includeAll: boolean,
  token: string,
): Promise<ResponseObject<Organisation[]>> =>
  callGET(`/api/OrganisationV2?includeall=${includeAll}`, token);

export const getOrganisation = (
  abbrev: string,
  token: string,
): Promise<ResponseObject<Organisation>> => callGET(`/api/Organisations/${abbrev}`, token);
export const getOrgMembers = (identifier: string, token: string) =>
  callGET(`/api/OrganisationV2/${identifier}/Members`, token);
export const getOrgFields = (identifier: string, token: string) =>
  callGET(`/api/OrganisationV2/${identifier}/Fields`, token) as Promise<
    ResponseObject<MetaDataColumn[]>
  >;
export const getOrgMetadataByField = (identifier: string, fields: string[], token: string) => {
  const fieldsQuery: string = `?${fields.map((field) => `fields=${field}`).join('&')}`;
  return callGET(
    `/api/OrganisationV2/${identifier}/Metadata/Fields${fieldsQuery}`,
    token,
  ) as Promise<ResponseObject<Sample[]>>;
};
export const getOrgMetadata = (
  identifier: string,
  token: string,
  searchParams?: URLSearchParams,
) => {
  return callGET(`/api/OrganisationV2/${identifier}/Metadata?${searchParams}`, token) as Promise<
    ResponseObject<Sample[]>
  >;
};

export const changeSampleOwner = (
  token: string,
  seqIds: string[],
  currentOrgAbbrev: string,
  newOwnerAbbrev: string,
  clientSessionId?: string,
) =>
  callPATCH(
    `/api/OrganisationV2/${currentOrgAbbrev}/samplesOwner`,
    token,
    { seqIds, newOwnerAbbrev },
    clientSessionId,
  );

export const postFeedback = (
  feedbackPostDto: FeedbackPost,
  token: string,
): Promise<ResponseObject<CreateMsg>> =>
  callPost<CreateMsg>('/api/Message/Feedback', token, feedbackPostDto);

// PermissionV2 endpoints
export const postProjectPrivilege = (
  recordGlobalId: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token: string,
  clientSessionId?: string,
) => callPost(`/api/Projects/${recordGlobalId}/Privilege`, token, privilegeBody, clientSessionId);

export const deleteProjectPrivilege = (
  recordGlobalId: string,
  assigneeGlobalId: string,
  roleGlobalId: string,
  token: string,
  clientSessionId?: string,
) =>
  callDELETE(
    `/api/Projects/${recordGlobalId}/Privilege?roleIdentifier=${roleGlobalId}&userIdentifier=${assigneeGlobalId}`,
    token,
    clientSessionId,
  );

export const postProformaPrivilege = (
  recordGlobalId: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token: string,
  clientSessionId?: string,
) => callPost(`/api/ProFormaV2/${recordGlobalId}/Privilege`, token, privilegeBody, clientSessionId);

export const deleteProformaPrivilege = (
  recordGlobalId: string,
  assigneeGlobalId: string,
  roleGlobalId: string,
  token: string,
  clientSessionId?: string,
) =>
  callDELETE(
    `/api/ProFormaV2/${recordGlobalId}/Privilege?roleIdentifier=${roleGlobalId}&userIdentifier=${assigneeGlobalId}`,
    token,
    clientSessionId,
  );

export const postTenantPrivilege = (
  _: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token: string,
  clientSessionId?: string,
) => callPost('/api/Tenant/Privilege', token, privilegeBody, clientSessionId);

export const deleteTenantPrivilege = (
  _: string,
  assigneeGlobalId: string,
  roleGlobalId: string,
  token: string,
  clientSessionId?: string,
) =>
  callDELETE(
    `/api/Tenant/Privilege?roleIdentifier=${roleGlobalId}&userIdentifier=${assigneeGlobalId}`,
    token,
    clientSessionId,
  );

// User
export const patchUser = (
  userGlobalId: string,
  userPatchDto: UserPatchV2,
  token: string,
  clientSessionId?: string,
) => callPATCH(`/api/Users/${userGlobalId}`, token, userPatchDto, clientSessionId);

export const disableUser = (userGlobalId: string, token: string, clientSessionId?: string) =>
  callPATCH(`/api/Users/disable/${userGlobalId}`, token, clientSessionId);

export const enableUser = (userGlobalId: string, token: string, clientSessionId?: string) =>
  callPATCH(`/api/Users/enable/${userGlobalId}`, token, clientSessionId);

// OrganisationV2

export const getOrganisationV2 = (organisationGlobalId: string, token: string) =>
  callGET(`/api/OrganisationV2/${organisationGlobalId}`, token);

export const patchUserOrganisationV2 = (
  userGlobalId: string,
  organisationGlobalId: string,
  targetOrgGlobalId: string,
  token: string,
) =>
  callPATCH(
    `/api/OrganisationV2/${organisationGlobalId}/User/${userGlobalId}`,
    token,
    targetOrgGlobalId,
  );

export const postOrgPrivilege = (
  recordGlobalId: string,
  privilegeBody: UserRoleRecordPrivilegePost,
  token: string,
  clientSessionId?: string,
) =>
  callPost(
    `/api/OrganisationV2/${recordGlobalId}/Privilege`,
    token,
    privilegeBody,
    clientSessionId,
  );

export const deleteOrgPrivilege = (
  recordGlobalId: string,
  assigneeGlobalId: string,
  roleGlobalId: string,
  token: string,
  clientSessionId?: string,
) =>
  callDELETE(
    `/api/OrganisationV2/${recordGlobalId}/Privilege?roleIdentifier=${roleGlobalId}&userIdentifier=${assigneeGlobalId}`,
    token,
    clientSessionId,
  );

// Tenant
export const getFieldsV2 = (token: string) => callGET('/api/MetaDataColumnsV2', token);
export const patchFieldV2 = (metaDataColumnName: string, token: string, field: any) =>
  callPATCH(`/api/MetaDataColumnsV2/${metaDataColumnName}`, token, field);

// Activity log
export const getActivities = (
  recordType: string,
  token: string,
  recordId?: string,
  searchParams?: URLSearchParams,
): Promise<ResponseObject<DerivedLog[]>> => {
  let resourcePath = '';
  if (recordType === RecordTypes.SYSTEM) {
    resourcePath = `/api/Tenant/ActivityLog?${searchParams}`;
  } else if (recordType === RecordTypes.ORGANISATION) {
    resourcePath = `/api/OrganisationV2/${recordId}/ActivityLog?${searchParams}`;
  } else if (recordType === RecordTypes.PROJECT) {
    resourcePath = `/api/Projects/${recordId}/ActivityLog?${searchParams}`;
  }
  return callGET(resourcePath, token);
};

// Returns a timestamp
export const getLatestActivityTime = (
  recordType: string,
  token: string,
  recordId?: string,
  searchParams?: URLSearchParams,
): Promise<ResponseObject<string>> => {
  let resourcePath = '';
  if (recordType === 'Tenant') {
    resourcePath = `/api/Tenant/ActivityLog/LatestTime?${searchParams}`;
  } else if (recordType === RecordTypes.ORGANISATION) {
    resourcePath = `/api/OrganisationV2/${recordId}/ActivityLog/LatestTime?${searchParams}`;
  } else if (recordType === RecordTypes.PROJECT) {
    resourcePath = `/api/Projects/${recordId}/ActivityLog/LatestTime?${searchParams}`;
  }
  return callGET(resourcePath, token);
};

// Project documents endpoints
export const getDocuments = (
  projectAbbrev: string,
  token: string,
): Promise<ResponseObject<ProjectDocument[]>> =>
  callGET(`/api/Projects/${projectAbbrev}/documents`, token);
export const getDocument = (
  projectAbbrev: string,
  documentStringId: string,
  token: string,
): Promise<ResponseObject<ProjectDocument>> =>
  callGET(`/api/Projects/${projectAbbrev}/documents/${documentStringId}`, token);

export const uploadDocument = (
  projectAbbrev: string,
  filename: string,
  description: string,
  formData: FormData,
  token: string,
): Promise<ResponseObject<ProjectDocument>> => {
  const customHeaders = buildDocumentUploadHeaders(filename, description);
  return callPOSTForm(
    `/api/Projects/${projectAbbrev}/documents/upload`,
    formData,
    token,
    customHeaders,
  );
};
export const disableDocument = (projectAbbrev: string, documentStringId: string, token: string) =>
  callPATCH(`/api/Projects/${projectAbbrev}/documents/${documentStringId}/disable`, token);
export const enableDocument = (projectAbbrev: string, documentStringId: string, token: string) =>
  callPATCH(`/api/Projects/${projectAbbrev}/documents/${documentStringId}/enable`, token);
export const updateDocument = (
  projectAbbrev: string,
  documentStringId: string,
  token: string,
  filename: string,
  description: string,
): Promise<ResponseObject<ProjectDocument>> =>
  callPATCH(`/api/Projects/${projectAbbrev}/documents/${documentStringId}/update`, token, {
    filename,
    description,
  });
export const downloadDocument = async (
  projectAbbrev: string,
  documentStringId: string,
  token: string,
) => {
  const response = await downloadFile(
    `/api/Projects/${projectAbbrev}/documents/${documentStringId}/download`,
    token,
  );
  return response;
};
export const previewDocument = async (
  projectAbbrev: string,
  documentStringId: string,
  token: string,
) => {
  const response = await previewFile(
    `/api/Projects/${projectAbbrev}/documents/${documentStringId}/preview`,
    token,
  );
  return response;
};
