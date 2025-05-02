import { useEffect, useState } from 'react';
import { RefinedLog } from '../types/dtos';
import { useApi } from '../app/ApiContext';
import { ResponseObject } from '../types/responseObject.interface';
import { getActivities } from '../utilities/resourceUtils';
import { ResponseType } from '../constants/responseType';
import LoadingState from '../constants/loadingState';

export default function useActivityLogs(
  recordType: string,
  rguid: string,
  owningTenantGlobalId: string,
) {
  const [refinedLogs, setRefinedLogs] = useState<RefinedLog[]>([]);
  const { token, tokenLoading } = useApi();
  const [exportData, setExportData] = useState<RefinedLog[]>([]);
  const [httpStatusCode, setHttpStatusCode] = useState<number>(-1);
  const [isLoadingErrorMsg, setIsLoadingErrorMsg] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  useEffect(() => {
    const getData = async () => {
      const resp: ResponseObject = await getActivities(
        recordType,
        rguid,
        owningTenantGlobalId,
        token,
      );
            
      if (resp.status === ResponseType.Success) {
        setRefinedLogs(resp.data as RefinedLog[]);
        setExportData(resp.data as RefinedLog[]);
      } else {
        setHttpStatusCode(resp.httpStatusCode || -1);
        setIsLoadingErrorMsg(resp.message);
      }
      setDataLoading(false);
    };

    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      setDataLoading(true);
      getData();
    }
  }, [recordType, rguid, token, tokenLoading, owningTenantGlobalId]);

  return { refinedLogs, exportData, dataLoading, httpStatusCode, isLoadingErrorMsg };
}
