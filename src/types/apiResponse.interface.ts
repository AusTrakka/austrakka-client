import { ResponseType } from '../constants/responseType';

export interface ApiResponse<T> {
  data: T
  messages: ResponseMessage[]
}

export interface ResponseMessage {
  ResponseType: ResponseType,
  ResponseMessage: string,
}
