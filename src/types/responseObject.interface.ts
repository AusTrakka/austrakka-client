// TODO: Refine this type definition
import { ResponseMessage } from './apiResponse.interface';
import { ResponseType } from '../constants/responseType';

export interface ResponseObject<TData = any> {
  status: ResponseType,
  data?: TData,
  message: string,
  messages?: ResponseMessage[],
  headers?: Headers,
  error?: any,
  type?: string;
}
