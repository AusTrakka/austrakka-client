import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Grid, Typography } from '@mui/material';

import { parse, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { InlineData } from 'vega-lite/build/src/data';
import { DataTable, DataTableFilterMeta, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import { aggregateArrayObjects } from '../../../utilities/dataProcessingUtils';
import ProjectWidgetProps from '../../../types/projectwidget.props';

// May want to parametrise field to make widget more flexible
const stFieldName = 'ST';

interface CountRow {
  [stFieldName]: string;
  sampleCount: number;
}

function STChart(props: any) {
  const { stData, stDataAggregated } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);

  const spec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      name: 'inputdata',
    },
    width: 'container',
    height: 250,
    mark: { type: 'bar', tooltip: true },
    encoding: {
      x: { field: 'Date_coll', type: 'temporal', title: 'Sample collected date (Date_coll)', bin: { maxbins: 20 }, axis: { format: ' %d %b %Y' } },
      y: { aggregate: 'count', title: 'Count of Samples' },
      color: {
        field: stFieldName,
        title: `${stFieldName} Value`,
        // NB not currently using defaultColorSchemeName
        scale: { scheme: stDataAggregated && stDataAggregated.length > 10 ? 'category20' : 'category10' },
      },
    },
    config: {
      legend: {
        symbolLimit: 0,
        orient: 'right',
        direction: 'vertical',
      },
    },
  };
  
  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const compiledSpec = compile(spec!).spec;
      const copy = stData.map((item: any) => ({
        ...item,
      }));
      (compiledSpec.data![0] as InlineData).values = copy;
      compiledSpec.legends![0].columns = Math.ceil(stDataAggregated.length / 16);
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .runAsync();
      setVegaView(view);
    };

    if (stData && plotDiv?.current) {
      createVegaView();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stData, plotDiv]);

  return (
    <Grid container direction="row">
      <Grid item xs={11}>
        <div id="#plot-container" ref={plotDiv} />
      </Grid>
      <Grid item xs={1}>
        <ExportVegaPlot
          vegaView={vegaView}
        />
      </Grid>
    </Grid>
  );
}

export default function StCounts(props: ProjectWidgetProps) {
  const {
    projectAbbrev, filteredData, timeFilterObject,
  } = props;
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const [aggregatedCounts, setAggregatedCounts] = useState<CountRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigate();

  useEffect(() => {
    if (data?.loadingState === MetadataLoadingState.DATA_LOADED ||
      (data?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED &&
        data.fieldLoadingStates[stFieldName] === LoadingState.SUCCESS)) {
      const counts = aggregateArrayObjects(stFieldName, filteredData!) as CountRow[];
      setAggregatedCounts(counts);
    }
  }, [filteredData, data?.loadingState, data?.fieldLoadingStates]);

  useEffect(() => {
    if (data?.fields && !data.fields.map(fld => fld.columnName).includes(stFieldName)) {
      setErrorMessage(`Field ${stFieldName} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[stFieldName] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${stFieldName} values`);
    }
  }, [data?.fields, data?.loadingState]);
  
  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;

    const drilldownFilter: DataTableFilterMeta = {
      [stFieldName]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: selectedRow[stFieldName],
          },
        ],
      },
    };
    // Append timeFilterObject for last_week and last_month filters
    if (timeFilterObject && Object.keys(timeFilterObject).length !== 0) {
      const appendedFilters: DataTableFilterMeta =
          {
            ...drilldownFilter,
            ...timeFilterObject,
          };
      updateTabUrlWithSearch(navigation, '/samples', appendedFilters);
    } else {
      updateTabUrlWithSearch(navigation, '/samples', drilldownFilter);
    }
  };

  const columns = useMemo<any[]>(() => [
    { field: stFieldName, header: `${stFieldName} Value` },
    { field: 'sampleCount', header: 'Sample count' },
  ], []);

  return (
    // <Box sx={{ flexGrow: 1 }}>
    <Box>
      <Typography variant="h5" paddingBottom={1} color="primary">
        {stFieldName}
        {' '}
        Counts
      </Typography>
      { data?.loadingState === MetadataLoadingState.DATA_LOADED && !errorMessage && (
      <Grid container direction="row" alignItems="center" spacing={2}>
        <Grid item xl={3} xs={4}>
          <DataTable
            value={aggregatedCounts}
            size="small"
            selectionMode="single"
            onRowClick={rowClickHandler}
          >
            {columns.map((col: any) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
              />
            ))}
          </DataTable>
        </Grid>
        <Grid item xl={9} xs={8}>
          <STChart
            stData={filteredData}
            stDataAggregated={aggregatedCounts}
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
