import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import { fetchProjectMetadata } from '../../app/projectMetadataSlice';
import { useAppDispatch } from '../../app/store';
import LoadingState from '../../constants/loadingState';
import MapDetail from './MapDetail';

function MapPage() {
  const { projectAbbrev } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    if (
      projectAbbrev &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      dispatch(fetchProjectMetadata({ projectAbbrev, token }));
    }
  }, [dispatch, projectAbbrev, token, tokenLoading]);

  if (!projectAbbrev) return null;

  return (
    <>
      <MapDetail navigateFunction={navigate} projectAbbrev={projectAbbrev} />
    </>
  );
}

export default MapPage;
