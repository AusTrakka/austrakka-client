import { getToken } from './authUtils';

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
}
// Constants
const genericErrorMessage = 'There was an error, please report this to an AusTrakka admin.';
const base = import.meta.env.VITE_REACT_API_URL;
const noToken = {
  status: 'Error',
  message: 'There has been an error, please try reloading the page or logging in again.',
};

async function callGET(url:string) {
  const token = await getToken();

  // Check if token is null/undefined before making API call
  if (!token) {
    return noToken as ResponseObject;
  }
  const options: HTTPOptions = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token?.accessToken}`,
      'Access-Control-Expose-Headers': '*',
      'Ocp-Apim-Subscription-Key': import.meta.env.VITE_SUBSCRIPTION_KEY,
    },
  };
  const apiResponse = await fetch(base + url, options)
    .then((response) => response.json().then((data) => ({
      data,
      headers: response.headers,
      statusOk: response.ok, // response.ok returns true if the status property is 200-299
    })))
    .then((resp) => {
      if (url.includes('analysisResults')) {
        // eslint-disable-next-line no-param-reassign
        resp.data = { data: resp.data, messages: [] }; // mash data into expected shape
      }
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
        message: resp.data.messages[0]?.ResponseMessage || genericErrorMessage,
      };
    })
    .catch((error) => ({ status: 'Error', message: genericErrorMessage, error }));
  return apiResponse as ResponseObject;
}

async function callPOSTForm(url:string, formData:FormData) {
  const token = await getToken();

  if (!token) {
    return noToken as ResponseObject;
  }
  const options: HTTPOptions = {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token?.accessToken}`,
      'Access-Control-Expose-Headers': '*',
      'Ocp-Apim-Subscription-Key': import.meta.env.VITE_SUBSCRIPTION_KEY,
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
async function downloadFile(url: string, method: string) {
  const base = import.meta.env.VITE_REACT_API_URL;
  const token = await getToken();

  if (!token) {
    throw new Error('Authentication error: Unable to retrieve access token.');
  }

  const options: HTTPOptions = {
    method,
    headers: {
      'Authorization': `Bearer ${token?.accessToken}`,
      'Ocp-Apim-Subscription-Key': import.meta.env.VITE_SUBSCRIPTION_KEY,
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
export const getProFormaDownload = async (abbrev: string) => {
  const response = await downloadFile(`/api/ProFormas/download/proforma/${abbrev}`, 'GET');
  return response;
};

export const getProjectList = () => callGET('/api/Projects?&includeall=false');
export const getProjectDetails = (abbrev: string) => callGET(`/api/Projects/abbrev/${abbrev}`);
export const getGroupList = () => callGET('/api/Group');
export const getUserGroups = () => callGET('/api/Users/Me');
export const getGroupDisplayFields = (group: number) => callGET(`/api/group/display-fields?GroupContext=${group}&filterSubmissionProperties=true`);
export const getPlots = (projectId: number) => callGET(`/api/Plots/project/${projectId}`);
export const getPlotDetails = (abbrev: string) => callGET(`/api/Plots/abbrev/${abbrev}`);
export const getPlotData = (groupId: number, fields: string[]) => {
  const fieldsQuery: string = fields.map((field) => `fields=${field}`).join('&');
  return callGET(`/api/MetadataSearch/by-field/?groupContext=${groupId}&${fieldsQuery}`);
};
export const getTrees = (projectId: number) => callGET(`/api/Analyses/?filters=ProjectId==${projectId}`);
export const getTreeData = (jobInstanceId: number) => callGET(`/api/JobInstance/${jobInstanceId}`);
export const getLatestTreeData = (analysisId: number) => callGET(`/api/JobInstance/${analysisId}/LatestVersion`);
export const getTreeVersions = (analysisId: number) => callGET(`/api/JobInstance/${analysisId}/AllVersions`);
export const getTreeMetaData = (analysisId: number, jobInstanceId: number) => callGET(`/api/analysisResults/${analysisId}/metadata/${jobInstanceId}`);
export const getSamples = (searchParams?: string) => callGET(`/api/MetadataSearch?${searchParams}`);
export const getTotalSamples = (groupId: number) => callGET(`/api/MetadataSearch/?groupContext=${groupId}&pageSize=1&page=1`);
export const getDisplayFields = (groupId: number) => callGET(`/api/Group/display-fields?groupContext=${groupId}`);
export const getGroupMembers = (groupId: number) => callGET(`/api/Group/Members?groupContext=${groupId}`);
export const getUserProformas = () => callGET('/api/Proformas');

// Project dashboards endpoints
export const getProjectDashboard = (projectId: number) => callGET(`/api/Projects/assigned-dashboard/${projectId}`);
export const getProjectDashboardOveriew = (groupId: number, searchParams?: string) => callGET(`/api/DashboardSearch/project-dashboard/overview/?groupContext=${groupId}&filters=${searchParams}`);
export const getDashboardFields = (groupId: number, fields?: string, searchParams?: string) => callGET(`/api/DashboardSearch/project-dashboard/select-fields-by-date?groupContext=${groupId}&fields=${fields}&filters=${searchParams}`);
export const getThresholdAlerts = (groupId: number, alertField: string) => callGET(`/api/DashboardSearch/project-dashboard/threshold-alerts?groupContext=${groupId}&alertField=${alertField}`);

// User dashboard endpoints
export const getUserDashboardOveriew = (searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/overview?filters=${searchParams}`);
export const getUserDashboardProjects = (searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/projects-total?filters=${searchParams}`);
export const getUserDashboardPhessStatus = (searchParams?: string) => callGET(`/api/DashboardSearch/user-dashboard/phess-status?filters=${searchParams}`);

export const validateSubmissions = (formData: FormData, params: string) => callPOSTForm(`/api/Submissions/ValidateSubmissions${params}`, formData);
export const uploadSubmissions = (formData: FormData, params: string) => callPOSTForm(`/api/Submissions/UploadSubmissions${params}`, formData);
