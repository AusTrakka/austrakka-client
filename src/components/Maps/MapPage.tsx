import { useNavigate, useParams } from 'react-router-dom';
import MapDetail from './MapDetail';

function MapPage() {
  const { projectAbbrev } = useParams();
  const navigate = useNavigate();

  if (!projectAbbrev) return null;

  return (
    <>
      <MapDetail navigateFunction={navigate} projectAbbrev={projectAbbrev} />
    </>
  );
}

export default MapPage;
