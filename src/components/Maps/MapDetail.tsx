import {
  Alert,
  Box,
  Divider,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { DataTable } from 'primereact/datatable';
import { useEffect, useRef, useState } from 'react';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
  selectProjectMetadataError,
} from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { hasCompleteData } from '../../constants/metadataLoadingState';
import { defaultContinuousColorScheme } from '../../constants/schemes';
import type { Field } from '../../types/dtos';
import type { Sample } from '../../types/sample.interface';
import { detectIsoType, getGroupedSupportedMaps, getMapGeoFields } from '../../utilities/mapUtils';
import {
  useStateFromSearchParamsForFilterObject,
  useStateFromSearchParamsForPrimitive,
} from '../../utilities/stateUtils';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import ColorSchemeSelector from '../Trees/TreeControls/SchemeSelector';
import MapChart from './MapChart';
import { MapCategory, type MapKey, MapLabels, MapRegistry } from './mapMeta';

interface MapDetailProps {
  projectAbbrev: string;
}

const isIso3Field = (field: Field) =>
  detectIsoType(field.metaDataColumnValidValues ?? []) === 'iso_3_char';

function MapDetail(props: MapDetailProps) {
  const { projectAbbrev } = props;

  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const errorMessage = useAppSelector((state) => selectProjectMetadataError(state, projectAbbrev));

  const [noSupportedMapsError, setNoSupportedMapsError] = useState<boolean>(false);
  const [geoFields, setGeoFields] = useState<string[]>([]);
  const [isDataTableFilterOpen, setIsDataTableFilterOpen] = useState<boolean>(true);
  const [internalSelectedFieldObj, setInternalSelectedFieldObj] = useState<Field | null>(null);
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

  const { solo, grouped } = getGroupedSupportedMaps(data?.supportedMaps ?? []);

  // Track previous map to safely handle Map transitions without breaking user selections
  const prevMapRef = useRef<MapKey | null>(null);

  // This use effect will set the state of the region toggle and also if it's disabled
  // biome-ignore lint/correctness/useExhaustiveDependencies: more dependencies
  useEffect(() => {
    if (data && hasCompleteData(data?.loadingState)) {
      setFilteredData(data.metadata ?? []);
    }
  }, [data, selectedMap]);

  useEffect(() => {
    if (data && hasCompleteData(data?.loadingState)) {
      setLoading(false);
    }
  }, [data]);

  // If there are no maps to use, then we will show an error alert...
  // If there is only one, auto select it
  useEffect(() => {
    if (data && hasCompleteData(data?.loadingState)) {
      const { solo: visibleSolo, grouped: visibleGrouped } = getGroupedSupportedMaps(
        data.supportedMaps,
      );
      const visibleKeys = [...visibleSolo, ...visibleGrouped];

      if (visibleKeys.length === 0) {
        setNoSupportedMapsError(true);
      } else {
        setNoSupportedMapsError(false); // reset on valid data
        if (visibleKeys.length === 1) setSelectedMap(visibleKeys[0]);
      }
    }
  }, [data, setSelectedMap]);

  useEffect(() => {
    if (data && hasCompleteData(data.loadingState) && data.fields) {
      const mapGeoFields = getMapGeoFields(data.fields, selectedMap);
      const mapGeoFieldNames = mapGeoFields.map((field) => field.columnName);

      if (mapGeoFields.length === 0) return;

      // 1. Update the available fields dropdown (preserves original order)
      setGeoFields(mapGeoFieldNames);

      const mapEntry = MapRegistry.find((entry) => entry.key === selectedMap);
      const isSolo = mapEntry?.category === MapCategory.SOLO;

      // 2. Check transition state to satisfy the GROUPED -> SOLO requirement
      const prevMap = prevMapRef.current;
      const prevMapEntry = prevMap ? MapRegistry.find((e) => e.key === prevMap) : null;
      const prevIsSolo = prevMapEntry?.category === MapCategory.SOLO;

      const mapChanged = prevMap !== selectedMap;
      const switchedToSolo = mapChanged && !prevIsSolo && isSolo;

      // 3. Evaluate the selected field
      const selectedFieldIsValid = mapGeoFieldNames.includes(selectedField);
      let nextSelectedField = selectedField;

      if (!selectedFieldIsValid) {
        // SCENARIO A: The current field is completely invalid for the new map
        const firstAvailableField = mapGeoFields[0].columnName;

        if (isSolo) {
          const nonIsoField = mapGeoFields.find((f) => !isIso3Field(f));
          nextSelectedField = nonIsoField ? nonIsoField.columnName : firstAvailableField;
        } else {
          nextSelectedField = firstAvailableField;
        }
      } else if (switchedToSolo) {
        // SCENARIO B: The field is technically valid, but we just switched to a SOLO map.
        // If we are currently holding an ISO3 field, try to swap to a non-ISO3 field.
        const currentFieldDef = mapGeoFields.find((f) => f.columnName === selectedField);

        if (currentFieldDef && isIso3Field(currentFieldDef)) {
          const nonIsoField = mapGeoFields.find((f) => !isIso3Field(f));
          if (nonIsoField) {
            nextSelectedField = nonIsoField.columnName;
          }
        }
      }

      // 4. Apply changes only if necessary (prevents resets on unrelated data updates)
      if (nextSelectedField !== selectedField) {
        setSelectedField(nextSelectedField);
      }

      // 5. Update the ref for the next render cycle
      prevMapRef.current = selectedMap;
    }
  }, [data, selectedMap, selectedField, setSelectedField]);

  useEffect(() => {
    if (data?.fields && hasCompleteData(data.loadingState) && selectedField) {
      const selectedFieldObj =
        data.fields.find((field) => field.columnName === selectedField) ?? null;
      if (!selectedFieldObj) setNoSupportedMapsError(true);

      setInternalSelectedFieldObj(selectedFieldObj);
    }
  }, [data, selectedField]);

  const renderErrorAlert = () => (
    <div>
      <Alert severity="warning">
        <Typography>This project has no compatible fields for map visualisations</Typography>
      </Alert>
    </div>
  );

  const renderMapSection = (label: string, keys: MapKey[]) => [
    <ListSubheader key={`${label}-header`} sx={{ fontWeight: 600, lineHeight: '32px' }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
    </ListSubheader>,
    ...keys.map((mapKey) => (
      <MenuItem key={mapKey} value={mapKey}>
        {MapLabels[mapKey]}
      </MenuItem>
    )),
  ];

  const renderControls = () => {
    const hasGrouped = grouped.length > 0;
    const hasSolo = solo.length > 0;

    return (
      <Box
        sx={{
          float: 'right',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
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
                setSelectedMap(e.target.value as MapKey);
              }}
              label="Map"
            >
              {hasGrouped && renderMapSection('Multi-country', grouped)}
              {hasSolo && hasGrouped && <Divider />}
              {hasSolo && renderMapSection('Country', solo)}
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
  };

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
