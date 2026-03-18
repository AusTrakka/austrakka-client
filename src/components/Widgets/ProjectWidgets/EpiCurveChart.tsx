import { Alert, AlertTitle, Box, Grid, Typography } from '@mui/material';
import type { DataTableOperatorFilterMetaData } from 'primereact/datatable';
import { useEffect, useRef, useState } from 'react';
import { parse, View as VegaView } from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { InlineData } from 'vega-lite/types_unstable/data.js';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import LoadingState from '../../../constants/loadingState';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import type ProjectWidgetProps from '../../../types/projectwidget.props';
import type { Sample } from '../../../types/sample.interface';
import { formatDate } from '../../../utilities/dateUtils';
import { createVegaScale, legendSpec, selectGoodTimeBinUnit } from '../../../utilities/plotUtils';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';

const TIME_AXIS_FIELD = 'Date_coll';

// The first of these fields that is present will be used to colour the plot
const FIELDS_AND_COLOURS: string[][] = [
  ['Jurisdiction', 'jurisdiction'],
  ['State', 'jurisdiction'],
  ['Country', 'tableau10'],
  ['Owner_group', 'tableau10'],
];
const DEFAULT_COLOUR_SCHEME = 'tableau10';

const UniformColourSpec = { value: Theme.SecondaryDarkGreen };

interface EpiCurveChartProps extends ProjectWidgetProps {
  preferredColourField?: string;
  dateFilterField: string;
}

/** Widget displaying a basic Epi Curve
 * Requires Date_coll for x-axis
 * Colour by Jurisdiction-style field if these fields present; otherwise dark green
 * */
function EpiCurveChart(props: EpiCurveChartProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
    dateFilterField,
    preferredColourField = null,
  } = props;
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeFilterDescription, setTimeFilterDescription] = useState<string>('');
  const [timeBinSpec, setTimeBinSpec] = useState<{ unit: string; step: number }>({
    unit: 'yearweek',
    step: 1,
  });
  const [colourSpec, setColourSpec] = useState<object>(UniformColourSpec);

  const createSpec = () => ({
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
      },
      y: { aggregate: 'count', title: 'Count of Samples' },
      color: colourSpec,
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    const setColourSpecFromField = (field: string, colourScheme: string) => {
      const values: string[] = data!.fieldUniqueValues![field]!;
      const colSpec = {
        field: field,
        scale: createVegaScale(values, colourScheme),
        legend: legendSpec,
      };
      setColourSpec(colSpec);
    };

    if (data?.loadingState !== MetadataLoadingState.DATA_LOADED || !data?.fields) {
      return;
    }

    // If preferred colour field specified and available, use it, otherwise go through list
    if (
      preferredColourField &&
      data.fields.map((fld) => fld.columnName).includes(preferredColourField)
    ) {
      const colourSchemePair = FIELDS_AND_COLOURS.find(
        (fld) => fld[0] === preferredColourField,
      ) ?? ['', DEFAULT_COLOUR_SCHEME];
      setColourSpecFromField(preferredColourField, colourSchemePair[1]);
    } else {
      for (const [field, colourScheme] of FIELDS_AND_COLOURS) {
        if (data!.fields!.map((fld) => fld.columnName).includes(field)) {
          setColourSpecFromField(field, colourScheme);
          break;
        }
      }
    }
  }, [data?.loadingState]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    if (data?.fields && !data.fields.map((fld) => fld.columnName).includes(TIME_AXIS_FIELD)) {
      setErrorMessage(`Field ${TIME_AXIS_FIELD} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[TIME_AXIS_FIELD] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${TIME_AXIS_FIELD} values`);
    }
  }, [data?.fields, data?.loadingState]);

  useEffect(() => {
    if (timeFilterObject && Object.keys(timeFilterObject).length > 0) {
      const { value } = (timeFilterObject[dateFilterField] as DataTableOperatorFilterMetaData)
        .constraints[0];
      setTimeFilterDescription(`${dateFilterField} after ${formatDate(value)}`);
    } else {
      setTimeFilterDescription('all time');
    }
  }, [timeFilterObject, dateFilterField]);

  useEffect(() => {
    // If there is no data, we cannot update range, so check filteredData length, not loadingState
    if (data?.fields && filteredData && filteredData.length > 0) {
      if (data.fields.some((field) => field.columnName === TIME_AXIS_FIELD)) {
        const bin = selectGoodTimeBinUnit(filteredData.map((row: Sample) => row[TIME_AXIS_FIELD]));
        setTimeBinSpec(bin);
      }
    }
  }, [data?.fields, filteredData]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const spec = createSpec();
      const compiledSpec = compile(spec as TopLevelSpec).spec;
      const copy = filteredData!.map((item: any) => ({
        ...item,
      }));
      (compiledSpec.data![0] as InlineData).values = copy;
      const view = await new VegaView(parse(compiledSpec)).initialize(plotDiv.current!).runAsync();
      setVegaView(view);
    };

    if (filteredData && plotDiv?.current) {
      createVegaView();
    }
  }, [filteredData, plotDiv, timeBinSpec, timeFilterObject, colourSpec]);

  return (
    <Box>
      <Typography variant="h5" paddingBottom={5} color="primary">
        {`Samples (${timeFilterDescription})`}
      </Typography>
      {data?.loadingState === MetadataLoadingState.DATA_LOADED && !errorMessage && (
        <Grid container direction="row" spacing={0}>
          <Grid item xs={11}>
            <div id="#plot-container" ref={plotDiv} />
          </Grid>
          <Grid item xs={1}>
            <ExportVegaPlot vegaView={vegaView} />
          </Grid>
        </Grid>
      )}
      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      {(!data?.loadingState ||
        !(
          data.loadingState === MetadataLoadingState.DATA_LOADED ||
          data.loadingState === MetadataLoadingState.ERROR ||
          data.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
        )) && <div>Loading...</div>}
    </Box>
  );
}
export default EpiCurveChart;
