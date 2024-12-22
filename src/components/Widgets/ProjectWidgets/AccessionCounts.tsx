import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { compile, TopLevelSpec } from 'vega-lite';
import { parse, View as VegaView } from 'vega';
import { useAppSelector } from '../../../app/store';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import LoadingState from '../../../constants/loadingState';
import ProjectWidgetProps from '../../../types/projectwidget.props';
import { Field } from '../../../types/dtos';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';

// Note we have hard-coded logic to strip the '-Owner' suffix from the organisation name,
// will need to change if the ownership field changes
const ORG_FIELD_NAME = 'Owner_group';
const ORG_FIELD_PLOTNAME = 'Owner_organisation';
const ACCESSION_FIELDS = ['Reads_accession', 'Assembly_accession'];

export default function AccessionCounts(props: ProjectWidgetProps) {
  const {
    projectAbbrev, filteredData, timeFilterObject,
  } = props;
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [accessionFields, setAccessionFields] = useState<Field[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const fieldTransforms = accessionFields.map(field => ({
    calculate: `datum['${field.columnName}'] ? 'Available' : 'Missing'`,
    as: `${field.columnName}_status`,
  }));
  
  // This is a bad solution as it reloads the page when clicked.
  // (as currently written, it also doesn't respect the dashboard time filter)
  // Instead should remove these transforms and add a click handler to the plot
  // e.g. https://stackoverflow.com/questions/57707494/whats-the-proper-way-to-implement-a-custom-click-handler-in-vega-lite
  // Note we compile the vega-lite to vega, so adding a signal is possible.
  const urlTransforms = accessionFields.map(field => ({
    calculate: `datum['${field.columnName}'] ? '/projects/${projectAbbrev}/samples?filters=(${field.columnName}:and:(true:custom))' : '/projects/${projectAbbrev}/samples?filters=(${field.columnName}:and:(false:custom))'`,
    as: `${field.columnName}_url`,
  }));

  const columnPlotSpec = (accField: string, axis: boolean = true) => ({
    title: `${accField} status`,
    layer: [{
      mark: { type: 'bar', tooltip: true },
      encoding: {
        x: {
          aggregate: 'count',
          axis: { title: 'Count' },
        },
        y: {
          field: ORG_FIELD_PLOTNAME,
          axis: { title: axis ? 'Organisation' : null },
        },
        color: {
          field: `${accField}_status`,
          scale: {
            domain: ['Available', 'Missing'],
            range: ['darkgreen', 'lightgrey'],
          },
          legend: { title: 'Accession status', orient: 'bottom' },
        },
        href: {
          field: `${accField}_url`,
        },
      },
    },
    {
      mark: { type: 'text', color: 'black' },
      encoding: {
        text: { aggregate: 'count' },
        x: {
          aggregate: 'count',
          stack: 'zero',
          bandPosition: 0.5,
        },
        y: { field: ORG_FIELD_PLOTNAME },
        detail: {
          field: `${accField}_status`,
        },
      },
    }],
  });
  
  // inputdata is expected to contain ORG_FIELD_NAME and accessionFields
  const spec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'inputdata' },
    transform: [
      { calculate: `split(datum['${ORG_FIELD_NAME}'],'-Owner')[0]`, as: ORG_FIELD_PLOTNAME },
      ...fieldTransforms,
      ...urlTransforms,
    ],
    width: 'container',
    height: 250,
    // hconcat doesn't behave well with container resizing
    // alternatives: draw two plots in this widget, or split into two widgets
    hconcat: accessionFields.map(field => columnPlotSpec(field.columnName)),
  };
  
  useEffect(() => {
    if (data?.loadingState && (
        data.loadingState === MetadataLoadingState.FIELDS_LOADED ||
        data.loadingState === MetadataLoadingState.DATA_LOADED)) {
      const fields = data.fields!.map(field => field.columnName);
      if (!fields.includes(ORG_FIELD_NAME)) {
        setErrorMessage(`Field ${ORG_FIELD_NAME} not found in project`);
      } else if (!fields.some(field => ACCESSION_FIELDS.includes(field))) {
        setErrorMessage('No accession fields found in project');
      } else {
        setAccessionFields(
          data!.fields!.filter(field => ACCESSION_FIELDS.includes(field.columnName)),
        );
      }
    }
  }, [data?.loadingState, data?.fields]);

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
  }, [filteredData, plotDiv, accessionFields]);
  
  useEffect(() => {
    if (data?.fields && !data.fields.map(fld => fld.columnName).includes(ORG_FIELD_NAME)) {
      setErrorMessage(`Field ${ORG_FIELD_NAME} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${ORG_FIELD_NAME} values`);
    }
  }, [data]);
  
  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        Accession counts
      </Typography>
      { data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.SUCCESS && (
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
      {errorMessage && (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {errorMessage}
      </Alert>
      )}
      {(!(data?.loadingState) ||
        !(data.loadingState === MetadataLoadingState.DATA_LOADED ||
          data.loadingState === MetadataLoadingState.ERROR ||
          data.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR)) && (
          <div>Loading...</div>
      )}
    </Box>
  );
}
