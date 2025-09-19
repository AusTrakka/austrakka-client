import React, { useEffect, useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import {
  Alert,
  Box, CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { DataTable } from 'primereact/datatable';
import {
  useStateFromSearchParamsForFilterObject,
  useStateFromSearchParamsForPrimitive,
} from '../../utilities/stateUtils';
import { defaultContinuousColorScheme } from '../../constants/schemes';
import ColorSchemeSelector from '../Trees/TreeControls/SchemeSelector';
import { ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { MapKey } from './mapMeta';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import MapChart from './MapChart';
import { Sample } from '../../types/sample.interface';
import { Field } from '../../types/dtos';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';

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
  const [geoFields, setGeoFields] = useState<string[]>([]);
  const [isDataTableFilterOpen, setIsDataTableFilterOpen] = useState<boolean>(true);
  const [internalSelectedFieldObj, setInternalSelectedFieldObj] = useState<Field | null>(null);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultContinuousColorScheme,
    navigateFunction,
  );
  const [selectedMap, setSelectedMap] = useStateFromSearchParamsForPrimitive<MapKey | null>(
    'map',
    null,
    navigateFunction,
  );
  const [selectedField, setSelectedField] = useStateFromSearchParamsForPrimitive<string>(
    'field',
    '',
    navigateFunction,
  );
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
    navigateFunction,
  );

  // This use effect will set the state of the region toggle and also if it's disabled
  useEffect(() => {
    if (data &&
        data.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredData(data.metadata ?? []);
    }
  }, [data, selectedMap]);

  useEffect(() => {
    if (data && data.loadingState === MetadataLoadingState.DATA_LOADED) {
      setLoading(false);
    }
  }, [data]);

  // if there are no maps to use, then we will show an error alert
  useEffect(() => {
    if (data &&
        data.loadingState === MetadataLoadingState.DATA_LOADED &&
        data.supportedMaps.length === 0) {
      setNoSupportedMapsError(true);
    }
  }, [data]);
  
  useEffect(() => {
    if (data &&
        data.loadingState === MetadataLoadingState.DATA_LOADED &&
        data.fields) {
      const geoFieldNames = data.fields
        .filter(field => field.geoField)
        .map(field => field.columnName) ?? [];
      const firstGeoField = geoFieldNames[0];

      // this should be setting an error as we shouldn't be here with no geo fields
      if (!firstGeoField) return;
      
      setSelectedField(firstGeoField);
      setGeoFields(geoFieldNames);
    }
  }, [data, setSelectedField]);

  useEffect(() => {
    if (data &&
        data.fields &&
        data.loadingState === MetadataLoadingState.DATA_LOADED &&
        selectedField) {
      const selectedFieldObj = data.fields
        .find(field => field.columnName === selectedField) ?? null;
      if (!selectedFieldObj) setNoSupportedMapsError(true);
      
      setInternalSelectedFieldObj(selectedFieldObj);
    }
  }, [data, selectedField]);

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
        width: '100%' }}
    >
      {/* Left group */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControl size="small" sx={{ margin: 1, marginTop: 1 }}>
          <InputLabel id="map-select-label">Map</InputLabel>
          <Select
            labelId="map-select-label"
            id="map-select"
            sx={{ minWidth: '100px' }}
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
        <FormControl
          size="small"
          sx={{ margin: 1 }}
        >
          <InputLabel id="map-select-geo-field">
            Field
          </InputLabel>
          <Select
            labelId="map-field-select-label"
            id="field-select"
            label="Field"
            defaultValue={selectedField}
            sx={{ minWidth: '100px' }}
            value={selectedField}
            onChange={(e) => {
              const field = e.target.value;
              setSelectedField(field);
            }}
          >
            {geoFields.map((field) => (
              <MenuItem key={field} value={field}>
                {field}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
  
  const renderMap = () => {
    if (noSupportedMapsError) {
      return renderErrorAlert();
    }
    
    if (selectedMap === null) {
      return (
        <>
          {renderControls()}
          <Alert severity="info">
            <Typography>
              Please select a map
            </Typography>
          </Alert>
        </>
      );
    }
    
    return (
      <>
        {renderControls()}
        <MapChart
          colourScheme={colourScheme}
          mapSpec={selectedMap!}
          projAbbrev={projectAbbrev}
          data={filteredData ?? []}
          geoField={internalSelectedFieldObj}
        />
      </>
    );
  };
  
  if (loading) return <div><CircularProgress color="info" /></div>;

  return (
    <>
      <Stack direction="column" spacing={2} display="flex">
        {renderMap()}
        <Stack>
          <DataFilters
            dataLength={data?.metadata?.length ?? 0}
            filteredDataLength={filteredData?.length ?? 0}
            visibleFields={null}
            allFields={data?.fields ?? []}
            setPrimeReactFilters={setCurrentFilters}
            primeReactFilters={currentFilters}
            isOpen={isDataTableFilterOpen}
            setIsOpen={setIsDataTableFilterOpen}
            dataLoaded={!loading}
            setLoadingState={setLoading}
            fieldUniqueValues={data?.fieldUniqueValues ?? null}
          />
        </Stack>
        <div style={{ display: 'none' }}>
          <DataTable
            value={data?.metadata ?? []}
            filters={!loading ? currentFilters : defaultState}
            paginator
            rows={1}
            onValueChange={(e) => {
              setFilteredData(e);
            }}
          />
        </div>
      </Stack>
    </>

  );
}

export default MapDetail;
