import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Stack } from '@mui/material';
import { useStateFromSearchParamsForPrimitive } from '../../utilities/stateUtils';
import { defaultDiscreteColorScheme } from '../../constants/schemes';
import ColorSchemeSelector from '../Trees/TreeControls/SchemeSelector';
import MapTest from './MapTest';

function MapTestDetail() {
  const { projectAbbrev } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultDiscreteColorScheme,
    searchParams,
  );

  const renderControls = () => (
    <Box sx={{ float: 'right', marginX: 10 }}>
      <ColorSchemeSelector
        selectedScheme={colourScheme}
        onColourChange={(newColor) => setColourScheme(newColor)}
        variant="outlined"
        size="small"
      />
    </Box>
  );
  
  return (
    <>
      <Stack direction="column" spacing={2} display="flex">
        {renderControls()}
        <MapTest colourScheme={colourScheme} projectAbbrev={projectAbbrev} />
              
      </Stack>
    </>
  );
}

export default MapTestDetail;
