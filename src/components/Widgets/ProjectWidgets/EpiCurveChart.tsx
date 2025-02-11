import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Grid, Typography } from '@mui/material';

import { parse, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { DataTableOperatorFilterMetaData } from 'primereact/datatable';
import { ScaleOrdinal } from 'd3';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import ProjectWidgetProps from '../../../types/projectwidget.props';
import { DashboardTimeFilterField } from '../../../constants/dashboardTimeFilter';
import { Sample } from '../../../types/sample.interface';
import { NULL_COLOUR } from '../../../utilities/colourUtils';
import { schemeJurisdiction, discreteColorSchemes } from '../../../constants/schemes';
import { legendSpec, selectGoodTimeBinUnit } from '../../../utilities/plotUtils';
import { formatDate } from '../../../utilities/dateUtils';

// Widget displaying a basic Epi Curve
// Requires Date_coll for x-axis
// Colour by Jurisdiction, State, or Owner_group if a field present; otherwise dark green

const TIME_AXIS_FIELD = 'Date_coll';
const JURISDICTION_FIELD = 'Jurisdiction';
const STATE_FIELD = 'State';
const OWNER_FIELD = 'Owner_group';
// Jurisdiction and state use the jurisdictional colour scheme, but owner organisations may 
// have multiple orgs per jurisdiction, so use a different scheme
const OWNER_COLOUR_SCHEME = 'set3';

const UniformColourSpec = { value: import.meta.env.VITE_THEME_SECONDARY_DARK_GREEN };

export default function EpiCurveChart(props: ProjectWidgetProps) {
  const {
    projectAbbrev, filteredData, timeFilterObject,
  } = props;
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeFilterDescription, setTimeFilterDescription] = useState<string>('');
  const [timeBinSpec, setTimeBinSpec] = useState<{ unit: string, step: number }>({ unit: 'yearweek', step: 1 });
  const [colourSpec, setColourSpec] = useState<object>(UniformColourSpec);

  const spec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      name: 'inputdata',
    },
    width: 'container',
    height: 250,
    mark: { type: 'bar', tooltip: true },
    encoding: {
      x: {
        field: TIME_AXIS_FIELD,
        type: 'temporal',
        title: 'Sample collected date (Date_coll)',
        timeUnit: timeBinSpec as any,
        // axis: { format: ' %d %b %Y' },
      },
      y: { aggregate: 'count', title: 'Count of Samples' },
      color: colourSpec,
    },
  };
  
  useEffect(() => {
    const setColourSpecFromField = (field: string, colourScheme: ScaleOrdinal<string, string>) => {
      // Works if field is configured with ANZ Jurisdiction or ISO State values 
      const values: string[] = data!.fieldUniqueValues![field]!;
      const colSpec = {
        // eslint-disable-next-line object-shorthand
        field: field,
        scale: {
          domain: values,
          // NB val ? assumes these values are strings, and therefore falsy values are null or empty
          range: values.map((val) => (val ? colourScheme(val) : NULL_COLOUR)),
        },
        legend: legendSpec,
      };
      setColourSpec(colSpec);
    };
    
    if (data?.loadingState !== MetadataLoadingState.DATA_LOADED || !data?.fields) {
      return;
    }
    if (data.fields.map(fld => fld.columnName).includes(JURISDICTION_FIELD)) {
      setColourSpecFromField(JURISDICTION_FIELD, schemeJurisdiction);
    } else if (data.fields.map(fld => fld.columnName).includes(STATE_FIELD)) {
      setColourSpecFromField(STATE_FIELD, schemeJurisdiction);
    } else if (data.fields.map(fld => fld.columnName).includes(OWNER_FIELD)) {
      setColourSpecFromField(OWNER_FIELD, discreteColorSchemes[OWNER_COLOUR_SCHEME]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.loadingState]);

  useEffect(() => {
    if (data?.fields && !data.fields.map(fld => fld.columnName).includes(TIME_AXIS_FIELD)) {
      setErrorMessage(`Field ${TIME_AXIS_FIELD} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[TIME_AXIS_FIELD] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${TIME_AXIS_FIELD} values`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.fields, data?.loadingState]);
  
  useEffect(() => {
    if (timeFilterObject && Object.keys(timeFilterObject).length > 0) {
      const { value } =
        (timeFilterObject[DashboardTimeFilterField] as DataTableOperatorFilterMetaData)
          .constraints[0];
      setTimeFilterDescription(`uploaded after ${formatDate(value)}`);
    } else {
      setTimeFilterDescription('all time');
    }
  }, [timeFilterObject]);
  
  useEffect(() => {
    // If there is no data, we cannot update range, so check filteredData length, not loadingState
    if (data?.fields && filteredData && filteredData.length > 0) {
      if (data.fields.some(field => field.columnName === TIME_AXIS_FIELD)) {
        const bin = selectGoodTimeBinUnit(
          filteredData.map((row: Sample) => row[TIME_AXIS_FIELD]),
        );
        setTimeBinSpec(bin);
      }
    }
  }, [data?.fields, filteredData]);

  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const compiledSpec = compile(spec!).spec;
      const copy = filteredData!.map((item: any) => ({
        ...item,
      }));
      (compiledSpec.data![0] as any).values = copy;
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .runAsync();
      setVegaView(view);
    };

    if (filteredData && plotDiv?.current) {
      createVegaView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, plotDiv, timeBinSpec, colourSpec]);
  
  return (
    // <Box sx={{ flexGrow: 1 }}>
    <Box>
      <Typography variant="h5" paddingBottom={5} color="primary">
        {`Samples (${timeFilterDescription})`}
      </Typography>
      { data?.loadingState === MetadataLoadingState.DATA_LOADED && !errorMessage && (
      <Grid container direction="row" spacing={0}>
        <Grid item xs={11}>
          <div id="#plot-container" ref={plotDiv} />
        </Grid>
        <Grid item xs={1}>
          <ExportVegaPlot
            vegaView={vegaView}
          />
        </Grid>
      </Grid>
      )}
      { errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      { (!data?.loadingState ||
          !(data.loadingState === MetadataLoadingState.DATA_LOADED ||
            data.loadingState === MetadataLoadingState.ERROR ||
            data.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR)) && (
            <div>Loading...</div>
      )}
    </Box>
  );
}
