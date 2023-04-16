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

  const options: HTTPOptions = {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Access-Control-Expose-Headers': '*',
      'Ocp-Apim-Subscription-Key': import.meta.env.VITE_SUBSCRIPTION_KEY,
    },
  };
  if (method !== 'GET') {
    options.body = JSON.stringify(requestData);
  }
  const apiRepsonse = await fetch(base + url, options)
    .then((response) => response.json().then((data) => ({
      data,
      headers: response.headers,
      statusOk: response.ok, // response.ok returns true if the status property is 200-299
    })))
    .then((resp) => {
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
  return apiRepsonse;
}

// Definition of endpoints

export const getProjectList = () => callAPI('/api/Projects?&includeall=false', 'GET', {});
export const getProjectDetails = (abbrev: string) => callAPI(`/api/Projects/abbrev/${abbrev}`, 'GET', {});
export const getSamples = (searchParams?: string) => callAPI(`/api/MetadataSearch?${searchParams}`, 'GET', {});
export const getTotalSamples = () => callAPI(`/api/MetadataSearch/?groupContext=${sessionStorage.getItem('selectedProjectMemberGroupId')}&pageSize=1&page=1`, 'GET', {});
