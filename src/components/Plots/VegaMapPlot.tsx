// This implements AusTrakka data retrieval and Vega plot rendering
// Implements elements common to all plot types
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { parse, View as VegaView } from 'vega';
import { compile } from 'vega-lite';
import { Alert, Grid } from '@mui/material';
// import Grid from '@mui/material/Grid2';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import ExportVegaPlot from './ExportVegaPlot';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import {
  selectProjectMetadata, ProjectMetadataState,
} from '../../app/projectMetadataSlice';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { useAppSelector } from '../../app/store';
import { Sample } from '../../types/sample.interface';
import { useStateFromSearchParamsForFilterObject } from '../../utilities/stateUtils';
import { useGlobalErrorListener } from './globalErrorListener';
import { parseGeoJson } from '../../utilities/mapUtils';

// A VegaMapPlot is like a VegaDataPlot, but has a framework for a map spec,
// takes a geojson spec as a prop, and transforms and inserts the tabular data into 
// a lookup table rather than into the data property.
// This allows us to use a simpler vega-lite spec for each map.

// TODO a hard coded-colour for now; later allow the user to select
const MAP_COLOUR = '#006d2c';

// TODO fix: longitude value in state is >360 if we scroll round the world

interface VegaMapPlotProps {
  geoSpec: object,
  geoLookupField: string,
  isoLookup: string,
  projectAbbrev: string | undefined,
  initialLatitude: number,
  initialLongitude: number,
  initialZoom: number,
}

interface GeoCountRow {
  geoFeature: string,
  count: number,
}

function VegaMapPlot(props: VegaMapPlotProps) {
  const {
    geoSpec,
    geoLookupField,
    isoLookup,
    projectAbbrev,
    initialLatitude,
    initialLongitude,
    initialZoom,
  } = props;
  const nameProperty = geoLookupField === 'Country' ? 'properties.NAME' : 'properties.name';
  const navigate = useNavigate();
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [transformedData, setTransformedData] = useState<GeoCountRow[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorOccurred, setErrorOccurred] = useState<boolean>(false);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [zoom, setZoom] = useState(initialZoom);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
    navigate,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);
  const metadata: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  
  const handleGlobalError = useCallback((event: ErrorEvent) => {
    if (event.error instanceof DOMException) {
      setErrorMsg('The plot could not be rendered. It may be too large for the browser. ' +
        'Consider filtering the data, or changing the selected fields.');
    } else {
      setErrorMsg('An error occurred rendering the plot. Please contact AusTrakka Support.');
    }

    setErrorOccurred(true);
    setLoading(false);
  }, []);

  useGlobalErrorListener(handleGlobalError);

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredData(metadata?.metadata!);
      setAllFieldsLoaded(true);
    }
  }, [metadata?.fieldLoadingStates, metadata?.loadingState, metadata?.metadata]);

  // Transform filteredData by counting the number of times each geoFeature appears
  // TODO move to testable utility function. Or do we already have it?
  useEffect(() => {
    if (filteredData.length > 0) {
      const geoCountRows: GeoCountRow[] = [];
      const lookupTable: Record<string, number> = {};
      const expectedValues = parseGeoJson(geoSpec, isoLookup);
      expectedValues.forEach((value) => {
        lookupTable[value] = 0; // for log, =1 . But how to show correct values on scale?
      });

      filteredData.forEach((sample) => {
        const geoFeature = sample[geoLookupField];
        if (lookupTable[geoFeature] === undefined) {
          // TODO should show a user-visible warning about values ignored because not on map
          // TODO should also count nulls and warn about those
          // eslint-disable-next-line no-console
          console.error(`Unexpected value ${geoFeature} in filtered data`);
        } else {
          lookupTable[geoFeature] += 1;
        }
      });
      Object.entries(lookupTable).forEach(([key, value]) => {
        geoCountRows.push({ geoFeature: key, count: value });
      });
      setTransformedData(geoCountRows);
    }
  }, [filteredData, isoLookup, geoLookupField, geoSpec]);
  
  // TODO this works but check: are we mixing vega-lite and vega pre-compilation?
  const createSpec = () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Map-based data visualisation.',
    width: 'container',
    height: 500, // TODO can we get responsive map height or fixed aspect ratio?
    // autosize: { type: 'fit', contains: 'padding' },
    data: {
      values: geoSpec,
      format: { property: 'features' },
    },
    params: [
      { name: 'tx', update: 'width / 2' }, // responsive to browser size
      { name: 'ty', update: 'height / 2' },
      {
        name: 'scale', // responsive to zoom
        value: zoom,
        on: [
          {
            events: { 'type': 'wheel', 'consume': true },
            update: 'clamp(scale * pow(1.003, -event.deltaY * pow(16, event.deltaMode)), 150, 50000)',
          },
        ],
      },
      {
        name: 'angles',
        value: [0, 0],
        on: [{ events: 'pointerdown', update: '[rotateX, centerY]' }],
      },
      {
        name: 'cloned',
        value: null,
        on: [{ events: 'pointerdown', update: "copy('projection')" }],
      },
      {
        name: 'start',
        value: null,
        on: [{ events: 'pointerdown', update: 'invert(cloned, xy())' }],
      },
      {
        name: 'drag', // responsive to pan (drag)
        value: null,
        on: [
          {
            events: '[pointerdown, window:pointerup] > window:pointermove',
            update: 'invert(cloned, xy())',
          },
        ],
      },
      {
        name: 'delta',
        value: null,
        on: [
          {
            events: { signal: 'drag' },
            update: '[drag[0] - start[0], start[1] - drag[1]]',
          },
        ],
      },
      {
        name: 'rotateX',
        value: -longitude,
        on: [{ events: { signal: 'delta' }, update: 'angles[0] + delta[0]' }],
      },
      {
        name: 'centerY',
        value: latitude,
        on: [
          {
            events: { signal: 'delta' },
            update: 'clamp(angles[1] + delta[1], -60, 60)',
          },
        ],
      }],
    transform: [{ // This lookup table has the aggregated counts from project metadata
      lookup: `properties.${isoLookup}`,
      from: {
        key: 'geoFeature',
        fields: ['geoFeature', 'count'],
        data: { values: [...transformedData] },
      },
    }],
    projection: {
      type: 'mercator',
      scale: { signal: 'scale' },
      rotate: [{ signal: 'rotateX' }, 0, 0],
      center: [0, { signal: 'centerY' }],
      translate: [{ signal: 'tx' }, { signal: 'ty' }],
    },
    mark: {
      type: 'geoshape',
      stroke: 'black',
    },
    encoding: {
      color: {
        field: 'count',
        type: 'quantitative',
        scale: {
          // Scale is set manually to white = 0; built-in schemes don't do this
          type: 'linear', // or log
          interpolate: 'cubehelix',
          domainMin: 0, // for log, =1
          domainMax: Math.max(1, ...transformedData.map(x => x.count)),
          range: ['white', MAP_COLOUR],
        },
      },
      tooltip: [
        { field: nameProperty, title: geoLookupField }, // TODO name vs NAME
        { field: 'count', title: 'Record count' },
      ],
    },
  });

  // Render plot by creating vega view
  useEffect(() => {
    setErrorOccurred(false);

    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const spec = createSpec();
      const compiledSpec = compile((spec as any)!).spec;

      setLoading(true);
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .addSignalListener('centerY', (name, lat_signal) => {
          setLatitude(lat_signal);
        })
        .addSignalListener('rotateX', (name, lon_signal) => {
          setLongitude(-lon_signal);
        })
        .addSignalListener('scale', (name, zoom_signal) => {
          setZoom(zoom_signal);
        })
        .runAsync();
      setVegaView(view);
      setLoading(false);
    };

    // For now we recreate view if data changes, not just if spec changes
    if (metadata?.loadingState &&
      (metadata.loadingState === MetadataLoadingState.DATA_LOADED ||
        metadata.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ||
        metadata.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) &&
      filteredData &&
      plotDiv?.current) {
      // TODO it appears this may trigger too often?
      createVegaView();
    }
    // Review: old vegaView is just being cleaned up and should NOT be a dependency?
    // loadingState is not a dependency as we only care about changes that co-occur with
    // filteredData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoSpec, geoLookupField, filteredData, transformedData, plotDiv]);

  // TODO simplify if we don't need mutableFilteredData
  useEffect(() => {
    if (metadata?.loadingState &&
      (metadata.loadingState === MetadataLoadingState.DATA_LOADED ||
        metadata.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ||
        metadata.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) &&
      Object.keys(currentFilters).length === 0) {
      // setMutableFilteredData(JSON.parse(JSON.stringify((metadata.metadata!))));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.metadata]);
  
  return (
    <>
      <Grid container direction="column">
        {!errorOccurred ? (
          <Grid container item direction="row">
            <Grid item xs={11}>
              <div id="#plot-container" ref={plotDiv} />
            </Grid>
            <Grid item xs={1}>
              <ExportVegaPlot
                vegaView={vegaView}
              />
            </Grid>
          </Grid>
        ) : (
          <Alert severity="error" sx={{ marginTop: '10px' }}>
            {errorMsg}
          </Alert>
        )}
        <Grid item xs={12}>
          <DataFilters
            dataLength={metadata?.metadata?.length ?? 0}
            filteredDataLength={filteredData.length ?? 0}
            fieldUniqueValues={metadata?.fieldUniqueValues ?? null}
            visibleFields={null}
            allFields={metadata?.fields ?? []}
            setPrimeReactFilters={setCurrentFilters}
            isOpen={isDataFiltersOpen}
            setIsOpen={setIsDataFiltersOpen}
            setLoadingState={setLoading}
            primeReactFilters={currentFilters}
            dataLoaded={loading || allFieldsLoaded}
          />
        </Grid>
      </Grid>
      <div style={{ display: 'none' }}>
        <DataTable
          value={metadata?.metadata ?? []}
          filters={allFieldsLoaded ? currentFilters : defaultState}
          paginator
          rows={1}
          onValueChange={(e) => {
            setFilteredData(e);
          }}
        />
      </div>
    </>
  );
}

export default VegaMapPlot;
