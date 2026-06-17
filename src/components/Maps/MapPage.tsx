import { Alert, Button } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import {
  fetchProjectMetadata,
  selectProjectStaleDataAvailable,
} from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
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

  const staleDataAvailable = useAppSelector((state) =>
    selectProjectStaleDataAvailable(state, projectAbbrev!),
  );

  const handleRefresh = () => {
    if (!projectAbbrev || !token) return;
    dispatch(fetchProjectMetadata({ projectAbbrev, token }));
  };

  if (!projectAbbrev) return null;

  return (
    <>
      {staleDataAvailable && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Refresh
            </Button>
          }
          sx={{ mb: 1 }}
        >
          Newer data is available for this project.
        </Alert>
      )}

      <MapDetail navigateFunction={navigate} projectAbbrev={projectAbbrev} />
    </>
  );
}

export default MapPage;
