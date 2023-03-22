import getToken from './authUtils';

interface HTTPOptions {
  [key: string]: any
}

// TODO: Refine this type definition
export interface ResponseObject {
  status: string,
  data?: any,
  message?: string,
  headers?: Headers
}

async function callAPI(url:string, method:string, requestData:object) {
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
  // return await fetch(base + url, options)
  const apiRepsonse = await fetch(base + url, options)
    .then((response) => response.json().then((data) => ({
      data,
      headers: response.headers,
    })))
    .then((resp) => {
      if (resp.data !== null) {
        return { status: 'success', data: resp.data, headers: resp.headers };
      }
      return { status: 'error', message: resp.data.messages.ResponseMessage };
    })
    .catch((error) => ({ status: 'error', message: error }));
  return apiRepsonse;
}

// Definition of endpoints

export const getProjectList = () => callAPI('/api/Projects?&includeall=false', 'GET', {});
export const getProjectDetails = () => callAPI(`/api/Projects/${sessionStorage.getItem('selectedProjectId')}`, 'GET', {});
export const getSamples = (searchParams?: string) => callAPI(`/api/MetadataSearch?${searchParams}`, 'GET', {});
export const getTotalSamples = () => callAPI(`/api/MetadataSearch/?groupContext=${sessionStorage.getItem('selectedProjectMemberGroupId')}&pageSize=1&page=1`, 'GET', {});
