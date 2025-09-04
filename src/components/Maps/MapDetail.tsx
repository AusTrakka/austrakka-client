import React, { useEffect, useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import {
  Alert,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { SupportRounded } from '@mui/icons-material';
import { useStateFromSearchParamsForPrimitive } from '../../utilities/stateUtils';
import { defaultDiscreteColorScheme } from '../../constants/schemes';
import ColorSchemeSelector from '../Trees/TreeControls/SchemeSelector';
import { ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { MapKey } from './mapMeta';
import MetadataLoadingState from '../../constants/metadataLoadingState';

interface MapDetailProps {
  navigateFunction: NavigateFunction
  projectAbbrev: string
}

function MapDetail(props: MapDetailProps) {
  const { navigateFunction, projectAbbrev } = props;
  const data: ProjectMetadataState | null = useAppSelector(
    state => selectProjectMetadata(state, projectAbbrev),
  );
  
  // this I don't really needs to be in the url
  const [noSupportedMapsError, setNoSupportedMapsError] = useState<boolean>(false);
  const [isRegionToggleDisabled, setIsRegionToggleDisabled] = useState<boolean>(false);
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultDiscreteColorScheme,
    navigateFunction,
  );
  const [selectedMap, setSelectedMap] = useStateFromSearchParamsForPrimitive<MapKey>(
    'map',
    'WORLD',
    navigateFunction,
  );
  const [regionToggle, setRegionToggle] = useStateFromSearchParamsForPrimitive<boolean>(
    'regionToggle',
    false,
    navigateFunction,
  );

  // This use effect will set the state of the region toggle and also if it's disabled
  useEffect(() => {
    if (data &&
        data.loadingState === MetadataLoadingState.DATA_LOADED) {
      const { supportedMaps } = data;
      const isRegionPresent = supportedMaps
        .find(([mapKey, _]) => mapKey === selectedMap)?.[1] ?? false;
      
      setIsRegionToggleDisabled(!isRegionPresent);
    }
  }, [data, selectedMap]);

  // if there are no maps to use, then we will show an error alert
  useEffect(() => {
    if (data &&
        data.loadingState === MetadataLoadingState.DATA_LOADED &&
        data.supportedMaps.length === 0) {
      setNoSupportedMapsError(true);
    }
  }, [data]);
  
  const renderErrorAlert = () => (
    <div>
      <Alert severity="error">
        <Typography>
          This project has no compatible fields for map visualisations
        </Typography>
      </Alert>
    </div>
  );

  const renderControls = () => (
    <Box
      sx={{ float: 'right',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '60%' }}
    >
      {/* Left group */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControl size="small" sx={{ margin: 1, marginTop: 1 }}>
          <InputLabel id="map-select-label">Map</InputLabel>
          <Select
            labelId="map-select-label"
            id="map-select"
            value={selectedMap}
            onChange={(e) => {
              const selectedMap = e.target.value as MapKey;
              setSelectedMap(selectedMap);
            }}
            label="Map"
          >
            {data?.supportedMaps.map(([mapKey, _]) => (
              <MenuItem key={mapKey} value={mapKey}>
                {mapKey}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ColorSchemeSelector
          selectedScheme={colourScheme}
          onColourChange={(newColor) => setColourScheme(newColor)}
          variant="outlined"
          size="small"
        />
      </Box>
      {/* Might need another select here for targeting iso code... */}
      {/* Right-aligned switch */}
      <FormControlLabel
        control={(
          <Switch
            checked={regionToggle}
            onChange={(e) => setRegionToggle(e.target.checked)}
            disabled={isRegionToggleDisabled}
          />
            )}
        label="Region View"
        sx={{ margin: 1 }}
      />
    </Box>
  );

  return (
    <>
      <Stack direction="column" spacing={2} display="flex">
        {noSupportedMapsError ? (
          renderErrorAlert()
        ) : (
          <>
            {renderControls()}
            {/* <MapChart */}
            {/*  colourScheme={colourScheme} */}
            {/*  projectAbbrev={projectAbbrev} */}
            {/*  mapSpec={Maps[selectedMap]} */}
            {/* /> */}
          </>
        )}
      </Stack>
    </>

  );
}

export default MapDetail;
