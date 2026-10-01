import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { DataTable } from 'primereact/datatable';
import { useEffect, useState } from 'react';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
  selectProjectMetadataError,
} from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { hasCompleteData } from '../../constants/metadataLoadingState';
import { defaultContinuousColorScheme } from '../../constants/schemes';
import type { Sample } from '../../types/sample.interface';
import { resolveEffectiveMap } from '../../utilities/mapUtils';
import {
  useStateFromSearchParamsForFilterObject,
  useStateFromSearchParamsForPrimitive,
} from '../../utilities/stateUtils';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import ColorSchemeSelector from '../Trees/TreeControls/SchemeSelector';
import MapChart from './MapChart';
import { MapFieldOverrides, MapGroups, type MapKey, MapLabels } from './mapMeta';

interface MapDetailProps {
  projectAbbrev: string;
}

function MapDetail(props: MapDetailProps) {
  const { projectAbbrev } = props;

  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );

  const errorMessage = useAppSelector((state) => selectProjectMetadataError(state, projectAbbrev));

  const [noSupportedMapsError, setNoSupportedMapsError] = useState<boolean>(false);
  const [geoFields, setGeoFields] = useState<string[]>([]);
  const [isDataTableFilterOpen, setIsDataTableFilterOpen] = useState<boolean>(true);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultContinuousColorScheme,
  );

  const [selectedMap, setSelectedMap] = useStateFromSearchParamsForPrimitive<MapKey | null>(
    'map',
    null,
  );

  const [selectedField, setSelectedField] = useStateFromSearchParamsForPrimitive<string>(
    'field',
    '',
  );

  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
  );

  const internalSelectedFieldObj =
    data?.fields && hasCompleteData(data.loadingState)
      ? (data.fields.find((field) => field.columnName === selectedField) ?? null)
      : null;

  const supportedKeys = data?.supportedMaps.map(([key]) => key) ?? [];
  const primaryKeys = [...new Set(supportedKeys.map((key) => MapGroups[key] ?? key))];

  const selectedFieldValues = internalSelectedFieldObj?.metaDataColumnValidValues?.length
    ? internalSelectedFieldObj.metaDataColumnValidValues
    : (data?.fieldUniqueValues?.[selectedField] ?? []);

  const resolvedMap =
    selectedMap !== null
      ? resolveEffectiveMap(selectedMap, selectedField, selectedFieldValues)
      : null;

  useEffect(() => {
    if (data && hasCompleteData(data?.loadingState)) {
      setFilteredData(data.metadata ?? []);
    }
  }, [data]);

  useEffect(() => {
    if (data && hasCompleteData(data?.loadingState)) {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (data && hasCompleteData(data?.loadingState)) {
      if (data.supportedMaps.length === 0) {
        setNoSupportedMapsError(true);
      } else {
        setNoSupportedMapsError(false);

        const primaries = [...new Set(data.supportedMaps.map(([key]) => MapGroups[key] ?? key))];

        if (primaries.length === 1) {
          setSelectedMap(primaries[0]);
        }
      }
    }
  }, [data, setSelectedMap]);

  useEffect(() => {
    if (data && hasCompleteData(data.loadingState) && data.fields) {
      const geoFieldNames = data.fields
        .filter((field) => field.geoField)
        .filter((field) => {
          const isOverridden = field.columnName in MapFieldOverrides;
          return !isOverridden || selectedMap === 'AUS_NZ';
        })
        .map((field) => field.columnName)
        .sort((a, b) => Number(a in MapFieldOverrides) - Number(b in MapFieldOverrides));

      const [firstGeoField] = geoFieldNames;

      if (!firstGeoField) return;

      if (!selectedField || !geoFieldNames.includes(selectedField)) {
        setSelectedField(firstGeoField);
      }
      setGeoFields(geoFieldNames);
    }
  }, [data, selectedField, setSelectedField, selectedMap]);

  useEffect(() => {
    if (data?.fields && hasCompleteData(data.loadingState) && selectedField) {
      const found = data.fields.some((field) => field.columnName === selectedField);

      if (!found) {
        setNoSupportedMapsError(true);
      }
    }
  }, [data, selectedField]);

  const renderErrorAlert = () => (
    <div>
      <Alert severity="warning">
        <Typography>This project has no compatible fields for map visualisations</Typography>
      </Alert>
    </div>
  );

  const renderControls = () => (
    <Box
      sx={{
        float: 'right',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControl size="small" sx={{ margin: 1, marginTop: 1 }}>
          <InputLabel id="map-select-label">Map</InputLabel>
          <Select
            labelId="map-select-label"
            id="map-select"
            sx={{ minWidth: '100px' }}
            value={selectedMap}
            onChange={(e) => {
              setSelectedMap(e.target.value as MapKey);
            }}
            label="Map"
          >
            {primaryKeys.map((mapKey) => (
              <MenuItem key={mapKey} value={mapKey}>
                {MapLabels[mapKey]}
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
        <FormControl size="small" sx={{ margin: 1 }}>
          <InputLabel id="map-select-geo-field">Field</InputLabel>
          <Select
            labelId="map-field-select-label"
            id="field-select"
            label="Field"
            defaultValue={selectedField}
            sx={{ minWidth: '100px' }}
            value={selectedField}
            onChange={(e) => {
              setSelectedField(e.target.value);
            }}
          >
            {geoFields.map((field) => (
              <MenuItem key={field} value={field}>
                {field}
                {field in MapFieldOverrides && ' (AUS only)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  const renderMap = () => {
    if (errorMessage) {
      return (
        <Stack direction="column" spacing={2} display="flex">
          <Alert severity="error">
            <Typography>Project Data is not setup, please contact an admin.</Typography>
          </Alert>
        </Stack>
      );
    }

    if (noSupportedMapsError) {
      return renderErrorAlert();
    }

    if (loading) {
      return (
        <Stack direction="column" spacing={2} display="flex">
          <Alert severity="info">
            <Typography>Loading data...</Typography>
          </Alert>
        </Stack>
      );
    }

    if (selectedMap === null) {
      return (
        <>
          {renderControls()}
          <Alert severity="info">
            <Typography>Please select a map</Typography>
          </Alert>
        </>
      );
    }

    if (resolvedMap === null) {
      return (
        <>
          {renderControls()}

          <Alert severity="info">
            <Typography>This field isn't compatible with the selected map.</Typography>
          </Alert>
        </>
      );
    }

    return (
      <>
        {renderControls()}

        <MapChart
          colourScheme={colourScheme}
          mapSpec={resolvedMap.mapKey}
          lookupField={resolvedMap.lookupField}
          projAbbrev={projectAbbrev}
          data={filteredData ?? []}
          geoField={internalSelectedFieldObj}
        />
      </>
    );
  };

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
