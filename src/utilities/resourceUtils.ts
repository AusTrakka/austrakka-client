import { getToken } from './authUtils';

interface HTTPOptions {
  [key: string]: any
}

// TODO: Refine this type definition
export interface ResponseObject {
  status: string,
  data?: any,
  message: string,
  headers?: Headers,
  error?: any,
}

async function callAPI(url:string, method:string, requestData:object) {
  const genericErrorMessage = 'There was an error, please report this to an AusTrakka admin.';
  const base = import.meta.env.VITE_REACT_API_URL;
  const token = await getToken();

  // Check if token is null/undefined before making API call
  if (!token) {
    return {
      status: 'Error',
      message: 'There has been an error, please try reloading the page or logging in again.',
    } as ResponseObject;
  }
  const options: HTTPOptions = {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token?.accessToken}`,
      'Access-Control-Expose-Headers': '*',
      'Ocp-Apim-Subscription-Key': import.meta.env.VITE_SUBSCRIPTION_KEY,
    },
  };
  if (method !== 'GET') {
    options.body = JSON.stringify(requestData);
  }
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
      // GET API calls
      if (method === 'GET') {
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
      }
      // non-GET API calls - don't validate data
      if (method !== 'GET' && resp.statusOk) {
        return {
          status: 'Success',
          message: resp.data.messages[0]?.ResponseMessage,
          data: resp.data.data,
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

// Definition of endpoints

export const getProjectList = () => callAPI('/api/Projects?&includeall=false', 'GET', {});
export const getProjectDetails = (abbrev: string) => callAPI(`/api/Projects/abbrev/${abbrev}`, 'GET', {});
export const getGroupDisplayFields = (group: number) => callAPI(`/api/group/display-fields?GroupContext=${group}&filterSubmissionProperties=true`, 'GET', {});
export const getPlots = (projectId: number) => callAPI(`/api/Plots/project/${projectId}`, 'GET', {});
export const getPlotDetails = (abbrev: string) => callAPI(`/api/Plots/abbrev/${abbrev}`, 'GET', {});
export const getPlotData = (groupId: number, fields: string[]) => {
  const fieldsQuery: string = fields.map((field) => `fields=${field}`).join('&');
  return callAPI(`/api/MetadataSearch/by-field/?groupContext=${groupId}&${fieldsQuery}`, 'GET', {});
};
export const getTrees = (projectId: number) => callAPI(`/api/Analyses/?filters=ProjectId==${projectId}`, 'GET', {});
export const getTreeData = (analysisId: number) => callAPI(`/api/JobInstance/${analysisId}/LatestVersion`, 'GET', {});
export const getTreeMetaData = (analysisId: number, jobInstanceId: number) => callAPI(`/api/analysisResults/${analysisId}/metadata/${jobInstanceId}`, 'GET', {});
export const getSamples = (searchParams?: string) => callAPI(`/api/MetadataSearch?${searchParams}`, 'GET', {});
export const getTotalSamples = (groupId: number) => callAPI(`/api/MetadataSearch/?groupContext=${groupId}&pageSize=1&page=1`, 'GET', {});
export const getDisplayFields = (groupId: number) => callAPI(`/api/Group/display-fields?groupContext=${groupId}`, 'GET', {});

// Project dashboards endpoints
export const getProjectDashboard = (projectId: number) => callAPI(`/api/Projects/assigned-dashboard/${projectId}`, 'GET', {});
export const getProjectDashboardOveriew = (groupId: number, searchParams?: string) => callAPI(`/api/DashboardSearch/project-dashboard/overview/?groupContext=${groupId}&filters=${searchParams}`, 'GET', {});
export const getDashboardFields = (groupId: number, fields?: string, searchParams?: string) => callAPI(`/api/DashboardSearch/project-dashboard/select-fields-by-date?groupContext=${groupId}&fields=${fields}&filters=${searchParams}`, 'GET', {});

// User dashboard endpoints
export const getUserDashboardOveriew = () => callAPI('/api/DashboardSearch/user-dashboard/overview', 'GET', {});
export const getUserDashboardProjects = () => callAPI('/api/DashboardSearch/user-dashboard/projects-total', 'GET', {});
export const getUserDashboardPhessStatus = () => callAPI('/api/DashboardSearch/user-dashboard/phess-status', 'GET', {});
