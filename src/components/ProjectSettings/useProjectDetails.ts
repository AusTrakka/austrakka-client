import { useCallback, useEffect, useState } from 'react';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Project } from '../../types/dtos';
import { getProjectDetails } from '../../utilities/resourceUtils';

export function useProjectDetails(
  projectAbbrev: string | undefined,
  token: string,
  tokenLoading: LoadingState,
) {
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectAbbrev) return;
    setStatus(LoadingState.LOADING);
    const response = await getProjectDetails(projectAbbrev, token);
    if (response.status === ResponseType.Success) {
      setProjectDetails(response.data!);
      setStatus(LoadingState.SUCCESS);
    } else {
      setErrorMessage(response.message);
      setStatus(LoadingState.ERROR);
    }
  }, [projectAbbrev, token]);

  useEffect(() => {
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      fetchProject();
    }
  }, [fetchProject, tokenLoading]);

  return { projectDetails, status, errorMessage, refetchProject: fetchProject };
}
