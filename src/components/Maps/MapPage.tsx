import { useNavigate } from 'react-router-dom';
import MapDetail from './MapDetail';

function MapPage() {
  const navigate = useNavigate();
  
  return (
    <>
      <MapDetail navigateFunction={navigate} />
    </>
  );
}

export default MapPage;
