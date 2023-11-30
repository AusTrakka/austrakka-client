// TODO: Refine this type definition
import { ResponseMessage } from './apiResponse.interface';

export interface ResponseObject<TData = any> {
  status: string,
  data?: TData,
  message: string,
  messages?: ResponseMessage[],
  headers?: Headers,
  error?: any,
  type?: string;
}
