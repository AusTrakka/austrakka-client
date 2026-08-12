import { useEffect, useRef, useState } from 'react';
import { useApi } from '../app/ApiContext';
import type { Filters } from '../components/Common/Activity/ActivityFilters';
import LoadingState from '../constants/loadingState';
import { ResponseType } from '../constants/responseType';
import TrakkaResponseHeaders from '../constants/trakkaResponseHeaders';
import type { DerivedLog } from '../types/dtos';
import type { ResponseObject } from '../types/responseObject.interface';
import { getActivities } from '../utilities/resourceUtils';

export interface ActivityLogsProps {
  recordType: string;
  filters: Filters;
  rguid?: string;
}

export type ActivityLogsResponse = {
  refinedLogs: DerivedLog[];
  exportData: DerivedLog[];
  dataLoading: boolean;
  httpStatusCode: number;
  isLoadingErrorMsg: string;
  maxLimitReached: boolean;
  maxLimit: number;
};

// TODO look at this structure; it mimics a hook but is not one
export default function useActivityLogs({
  recordType,
  filters,
  rguid,
}: ActivityLogsProps): ActivityLogsResponse {
  const [refinedLogs, setRefinedLogs] = useState<DerivedLog[]>([]);
  const { token, tokenLoading } = useApi();
  const [exportData, setExportData] = useState<DerivedLog[]>([]);
  const [httpStatusCode, setHttpStatusCode] = useState<number>(-1);
  const [isLoadingErrorMsg, setIsLoadingErrorMsg] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [maxLimitReached, setMaxLimitReached] = useState<boolean>(false);
  const [maxLimit, setMaxLimit] = useState<number>(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getData = async () => {
      const params = new URLSearchParams();

      if (filters.resourceUniqueString)
        params.append('resourceIdentifier', filters.resourceUniqueString);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.submitterDisplayName)
        params.append('submitterDisplayName', filters.submitterDisplayName);
      if (filters.startDate) params.append('startDateTime', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDateTime', filters.endDate.toISOString());

      const resp: ResponseObject<DerivedLog[]> = await getActivities(
        recordType,
        token,
        rguid,
        params,
      );
      if (resp.status === ResponseType.Success) {
        setRefinedLogs(resp.data ?? []);
        setExportData(resp.data ?? []);
        setHttpStatusCode(resp.httpStatusCode || -1);
        const maxLimitReached = resp.headers?.get(TrakkaResponseHeaders.MaxLimitReached);
        if (maxLimitReached) {
          setMaxLimitReached(true);
          setMaxLimit(parseInt(maxLimitReached, 10));
        }
      } else {
        setRefinedLogs([]);
        setHttpStatusCode(resp.httpStatusCode || -1);
        setIsLoadingErrorMsg(resp.message);
      }
      setDataLoading(false);
    };

    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      setDataLoading(true);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        await getData();
      }, 600);
    }
  }, [filters, recordType, rguid, token, tokenLoading]);

  return {
    refinedLogs: refinedLogs,
    exportData: exportData,
    dataLoading: dataLoading,
    httpStatusCode: httpStatusCode,
    isLoadingErrorMsg: isLoadingErrorMsg,
    maxLimitReached: maxLimitReached,
    maxLimit: maxLimit,
  };
}
