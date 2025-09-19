import { useNavigate, useParams } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useAppDispatch } from '../../app/store';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { fetchProjectMetadata } from '../../app/projectMetadataSlice';
import MapDetail from './MapDetail';

function MapPage() {
  const { projectAbbrev } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    if (projectAbbrev &&
        tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
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
