interface HTTPOptions {
  [key: string]: any
}

// TODO: Refine this type definition
export interface ResponseObject {
  status: string,
  data?: any,
  message: string,
  messages?: string[],
  headers?: Headers,
  error?: any,
  type: string;
}
// Constants
const genericErrorMessage = 'There was an error, please report this to an AusTrakka admin.';
const base = import.meta.env.VITE_REACT_API_URL;
const noToken = {
  status: 'Error',
  message: 'There has been an error, please try reloading the page or logging in again.',
};

// NEW: Token passed as prop via endpoint calls
async function callGET(url:string, token : string) {
  // Check if token is null/undefined before making API call
  if (!token) {
    return noToken as ResponseObject;
  }
  const options: HTTPOptions = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Access-Control-Expose-Headers': '*',
    },
  };
  const apiResponse = await fetch(base + url, options)
    .then((response) => response.json().then((data) => ({
      data,
      headers: response.headers,
      statusOk: response.ok,
      statusText: response.statusText, // response.ok returns true if the status property is 200-299
    })))
    .then((resp) => {
      if (resp.data.data !== null && resp.statusOk) {
        return {
          status: 'Success',
          message: resp.data.messages[0]?.ResponseMessage,
          data: resp.data.data,
          headers: resp.headers,
        };
      }
      return {
        status: 'Error',
        type: resp.statusText,
        message: resp.data.messages[0]?.ResponseMessage || genericErrorMessage,
      };
    })
    .catch((error) => ({ status: 'Error', message: genericErrorMessage, error }));
  return apiResponse as ResponseObject;
}

async function callPOSTForm(url:string, formData:FormData, token : string) {
  if (!token) {
    return noToken as ResponseObject;
  }
  const options: HTTPOptions = {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Access-Control-Expose-Headers': '*',
    },
  };
  const apiResponse = await fetch(base + url, options)
    .then((response) => response.json().then((data) => ({
      data,
      headers: response.headers,
      statusOk: response.ok, // response.ok returns true if the status property is 200-299
    })))
    .then((resp) => {
      if (resp.statusOk) {
        return {
          status: 'Success',
          messages: resp.data.messages,
          data: resp.data.data,
        };
      }
      return {
        status: 'Error',
        messages: resp.data.messages || [genericErrorMessage],
      };
    })
    .catch((error) => ({ status: 'Error', message: genericErrorMessage, error }));
  return apiResponse as ResponseObject;
}

async function downloadFile(url: string, token : string) {
  if (!token) {
    throw new Error('Authentication error: Unable to retrieve access token.');
  }

  const options: HTTPOptions = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  let filename = 'no-file-name.xlsx'; // Default filename
  const response = await fetch(base + url, options);

  if (!response.ok) {
    throw new Error('Network response was not ok.');
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  if (contentDisposition) {
    try {
      const parts = contentDisposition.split(';');
      const filenamePart = parts.find(part => part.trim().startsWith('filename='));
      if (filenamePart) {
        filename = filenamePart.split('=')[1].trim().replace(/"/g, '');
      }
    } catch {
      filename = 'no-file-name.xlsx';
    }
  }
  const blob = await response.blob();
  return { blob, suggestedFilename: filename };
}

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
export const getGroupDisplayFields = (group: number, token: string) => callGET(`/api/group/display-fields?GroupContext=${group}&filterSubmissionProperties=true`, token);
export const getPlots = (projectId: number, token: string) => callGET(`/api/Plots/project/${projectId}`, token);
export const getPlotDetails = (abbrev: string, token: string) => callGET(`/api/Plots/abbrev/${abbrev}`, token);
export const getPlotData = (groupId: number, fields: string[], token: string) => {
  const fieldsQuery: string = fields.map((field) => `fields=${field}`).join('&');
  return callGET(`/api/MetadataSearch/by-field/?groupContext=${groupId}&${fieldsQuery}`, token);
};
export const getTrees = (projectId: number, token: string) => callGET(`/api/Analyses/?filters=ProjectId==${projectId}`, token);
export const getTreeData = (jobInstanceId: number, token: string) => callGET(`/api/JobInstance/${jobInstanceId}`, token);
export const getLatestTreeData = (analysisId: number, token: string) => callGET(`/api/JobInstance/${analysisId}/LatestVersion`, token);
export const getTreeVersions = (analysisId: number, token: string) => callGET(`/api/JobInstance/${analysisId}/AllVersions`, token);
export const getTreeMetaData = (analysisId: number, jobInstanceId: number, token: string) => callGET(`/api/analysisResults/${analysisId}/metadata/${jobInstanceId}`, token);
export const getSamples = (token: string, searchParams?: string) => callGET(`/api/MetadataSearch?${searchParams}`, token);
export const getTotalSamples = (groupId: number, token: string) => callGET(`/api/MetadataSearch/?groupContext=${groupId}&pageSize=1&page=1`, token);
export const getDisplayFields = (groupId: number, token: string) => callGET(`/api/Group/display-fields?groupContext=${groupId}`, token);
export const getGroupMembers = (groupId: number, token: string) => callGET(`/api/Group/Members?groupContext=${groupId}`, token);
export const getGroupProFormas = (groupId: number, token: string) => callGET(`/api/ProFormas/VersionInformation?groupContext=${groupId}`, token);
export const getUserProformas = (token: string) => callGET('/api/Proformas', token);

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
