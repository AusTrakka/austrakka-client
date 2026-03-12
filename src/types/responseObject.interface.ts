// TODO: Refine this type definition

import type { ResponseType } from '../constants/responseType';
import type { ResponseMessage } from './apiResponse.interface';

export interface ResponseObject<TData = any> {
  status: ResponseType;
  httpStatusCode?: number;
  data?: TData;
  message: string;
  messages: ResponseMessage[];
  headers?: Headers;
  error?: any;
  type?: string;
}
