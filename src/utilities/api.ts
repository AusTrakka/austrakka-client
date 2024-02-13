import { ResponseType } from '../constants/responseType';
import { ApiResponse } from '../types/apiResponse.interface';
import { ResponseObject } from '../types/responseObject.interface';

interface HTTPOptions {
  [key: string]: any
}

// Constants
const genericErrorMessage = 'There was an error, please report this to an AusTrakka admin.';
const expiredTokenErrorMessage = 'Your session has expired. Please refresh.';
const base = import.meta.env.VITE_REACT_API_URL;
const noToken = {
  status: ResponseType.Error,
  message: 'There has been an error, please try reloading the page or logging in again.',
};
const WWW_AUTHENTICATE = 'www-authenticate';
const INVALID_TOKEN = 'invalid_token';

function getHeaders(token: string): any {
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Access-Control-Expose-Headers': '*',
  };
}

async function parseApiResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

async function fetchAndParse<T = any>(url: string, options: HTTPOptions)
  : Promise<[ApiResponse<T>, Response]> {
  const response = await fetch(base + url, options);
  let apiResp: ApiResponse<T>;
  try {
    apiResp = await parseApiResponse<T>(response);
  } catch {
    apiResp = <ApiResponse<any>>{};
  }
  return [apiResp, response];
}

function tokenExpired(response: Response) {
  return response.headers.get(WWW_AUTHENTICATE)?.includes(INVALID_TOKEN);
}

function tokenExpiredResponse(response: Response): ResponseObject {
  return {
    status: ResponseType.Error,
    type: response.statusText,
    message: expiredTokenErrorMessage,
  };
}

function successResponse(response: Response, apiResp: ApiResponse<any>): ResponseObject {
  return {
    status: ResponseType.Success,
    message: apiResp.messages[0]?.ResponseMessage,
    data: apiResp.data,
    headers: response.headers,
    messages: apiResp.messages,
  };
}

function errorResponse(response: Response, apiResp: ApiResponse<any>): ResponseObject {
  return {
    status: ResponseType.Error,
    type: response.statusText,
    message: apiResp.messages[0]?.ResponseMessage || genericErrorMessage,
    messages: apiResp.messages || [genericErrorMessage],
  };
}

function fatalResponse(error: any): ResponseObject {
  return ({ status: ResponseType.Error, message: genericErrorMessage, error });
}

async function callApi(url: string, options: HTTPOptions): Promise<ResponseObject> {
  try {
    const [apiResp, response] = await fetchAndParse(url, options);
    if (tokenExpired(response)) {
      return tokenExpiredResponse(response);
    }
    if (apiResp !== null && response.ok) {
      return successResponse(response, apiResp);
    }
    return errorResponse(response, apiResp);
  } catch (error: any) {
    return fatalResponse(error);
  }
}

// Call an endpoint that does not return an ApiResponse object
export async function callSimpleGET(url: string, token: string): Promise<Response> {
  if (!token) {
    throw new Error('Authentication error: Unable to retrieve access token.');
  }
  return fetch(base + url, {
    method: 'GET',
    headers: getHeaders(token),
  });
}

// NEW: Token passed as prop via endpoint calls
export async function callGET(url: string, token: string): Promise<ResponseObject> {
  // Check if token is null/undefined before making API call
  if (!token) {
    return noToken;
  }
  return callApi(url, {
    method: 'GET',
    headers: getHeaders(token),
  });
}

export async function callPOSTForm(url: string, formData: FormData, token: string)
  : Promise<ResponseObject> {
  if (!token) {
    return noToken as ResponseObject;
  }

  return callApi(url, {
    method: 'POST',
    body: formData,
    headers: getHeaders(token),
  });
}

export async function downloadFile(url: string, token: string) {
  if (!token) {
    throw new Error('Authentication error: Unable to retrieve access token.');
  }

  const options: HTTPOptions = {
    method: 'GET',
    headers: getHeaders(token),
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
