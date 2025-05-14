import { useEffect, useState } from 'react';
import { RefinedLog } from '../types/dtos';
import { useApi } from '../app/ApiContext';
import { ResponseObject } from '../types/responseObject.interface';
import { getActivities } from '../utilities/resourceUtils';
import { ResponseType } from '../constants/responseType';
import LoadingState from '../constants/loadingState';

export interface FirstPageRequest
{
  startPeriod: string;
  endPeriod: string;
  pageSize: number;
}

export interface NextPageDescRequest
{
  previousDateTime: string;
  startPeriod: string;
  previousRefinedLogId: number;
}

export default function useActivityLogs(
  recordType: string,
  rguid: string,
  owningTenantGlobalId: string,
  initialReq: FirstPageRequest,
) {
  const [ refinedLogs, setRefinedLogs ] = useState<RefinedLog[]>([]);
  const { token, tokenLoading } = useApi();
  const [ exportData, setExportData ] = useState<RefinedLog[]>([]);
  const [ httpStatusCode, setHttpStatusCode ] = useState<number>(-1);
  const [ isLoadingErrorMsg, setIsLoadingErrorMsg ] = useState<string>('');
  const [ dataLoading, setDataLoading ] = useState<boolean>(true);
  const [ moreDataLoading, setMoreDataLoading ] = useState<boolean>(false);
  const [ noMoreData, setNoMoreData ] = useState<boolean>(false);
  const [ cursor, setCursor ] = useState<NextPageDescRequest | null>(null);

  const getData = async (append: boolean = false) => {
    const resp: ResponseObject<RefinedLog[]> = await getActivities(
      recordType,
      rguid,
      owningTenantGlobalId,
      token,
      initialReq,
      cursor,
    );

    let pageSize = initialReq.pageSize;
    if (resp.status === ResponseType.Success) {
      const newData = resp.data ?? [];

      if (newData.length < pageSize) {
        setNoMoreData(true);
      }

      if (append) {
        setRefinedLogs(prev => [...prev, ...newData]);
        setExportData(prev => [...prev, ...newData]);
      } else {
        setRefinedLogs(newData);
        setExportData(newData);
      }

      // Update cursor for the next page
      if (newData.length > 0) {
        const last = newData[newData.length - 1];
        setCursor({
          previousDateTime: last.eventTime,
          startPeriod: initialReq.startPeriod,
          previousRefinedLogId: last.refinedLogId,
        });
      }
    } else {
      setHttpStatusCode(resp.httpStatusCode || -1);
      setIsLoadingErrorMsg(resp.message);
    }

    setDataLoading(false);
    setMoreDataLoading(false);
  };

  // Initial load
  useEffect(() => {
    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      setDataLoading(refinedLogs.length === 0);
      setCursor(null); // reset cursor on dependency change
      setNoMoreData(false);
      getData(false);
    }
  }, [recordType, rguid, token, tokenLoading, owningTenantGlobalId]);

  const loadMore = async () => {
    if (moreDataLoading || noMoreData) return;

    setMoreDataLoading(true);
    await getData(true); // append new data
  };

  return {
    refinedLogs,
    exportData,
    dataLoading,
    moreDataLoading,
    httpStatusCode,
    isLoadingErrorMsg,
    loadMore,
    noMoreData,
  };
}

