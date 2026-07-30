import { useNavigate } from 'react-router-dom';
import MapDetail from './MapDetail';

function MapPage() {
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
      <MapDetail navigateFunction={navigate} />
    </>
  );
}

export default MapPage;
