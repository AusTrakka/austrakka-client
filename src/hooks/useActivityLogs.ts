import { useEffect, useState } from 'react';
import { DerivedLog } from '../types/dtos';
import { useApi } from '../app/ApiContext';
import { ResponseObject } from '../types/responseObject.interface';
import { getActivities } from '../utilities/resourceUtils';
import { ResponseType } from '../constants/responseType';
import LoadingState from '../constants/loadingState';

// TODO look at this structure; it mimics a hook but is not one
export default function useActivityLogs(
  recordType: string,
  rguid?: string,
) {
  const [refinedLogs, setRefinedLogs] = useState<DerivedLog[]>([]);
  const { token, tokenLoading } = useApi();
  const [exportData, setExportData] = useState<DerivedLog[]>([]);
  const [httpStatusCode, setHttpStatusCode] = useState<number>(-1);
  const [isLoadingErrorMsg, setIsLoadingErrorMsg] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  useEffect(() => {
    const getData = async () => {
      const resp: ResponseObject<DerivedLog[]> = await getActivities(
        recordType,
        rguid,
        token,
      );
      if (resp.status === ResponseType.Success) {
        setRefinedLogs(resp.data ?? []);
        setExportData(resp.data ?? []);
      } else {
        setHttpStatusCode(resp.httpStatusCode || -1);
        setIsLoadingErrorMsg(resp.message);
      }
      setDataLoading(false);
    };

    if (tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      setDataLoading(true);
      getData();
    }
  }, [recordType, rguid, token, tokenLoading]);

  return { refinedLogs, exportData, dataLoading, httpStatusCode, isLoadingErrorMsg };
}
