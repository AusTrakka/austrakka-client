import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Grid, Typography } from '@mui/material';
import { parse, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { InlineData } from 'vega-lite/build/src/data';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchStCounts, selectAggregatedStCounts, selectStCounts } from './stCountsSlice';
import LoadingState from '../../../constants/loadingState';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';
import { useApi } from '../../../app/ApiContext';
import FieldTypes from '../../../constants/fieldTypes';

const stFieldName = 'ST';

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
      scale: { scheme: 'spectral' },
    },
  },
  config: {
    legend: {
      symbolLimit: 0,
    },
  },
  // params: [
  //   {
  //     name: 'ST',
  //     select: { type: 'point', fields: ['ST'] },
  //     bind: 'legend',
  //   },
  //   {
  //     name: 'hover',
  //     select: { type: 'point', on: 'mouseover', clear: 'mouseout' },
  //   },
  // ],
  // encoding: {
  //   x: {
  //     timeUnit: 'yearmonthdate',
  //     field: 'Date_created',
  //     type: 'temporal',
  //     title: 'Sample created date',
  //     // scale: { type: 'utc' }
  //   },
  //   y: { aggregate: 'count', title: 'Count of Samples' },
  //   color: { field: 'ST', title: 'ST Value' },
  //   opacity: {
  //     condition: { param: 'ST', value: 1 },
  //     value: 0.2,
  //   },
  //   strokeWidth: {
  //     condition: [
  //       {
  //         param: 'hover',
  //         empty: false,
  //         value: 1,
  //       },
  //     ],
  //     value: 0,
  //   },
  // },
};

function STChart(props: any) {
  const { stData, stDataAggregated } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);

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

export default function StCounts(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, loading } = useAppSelector(selectStCounts);
  const aggregatedCounts = useAppSelector(state => selectAggregatedStCounts(state, stFieldName));
  const { timeFilter, timeFilterObject } = useAppSelector((state) => state.projectDashboardState);
  const { token, tokenLoading } = useApi();

  const stCountsDispatch = useAppDispatch();

  useEffect(() => {
    const dispatchProps = { groupId, token, projectId, timeFilter, aggField: stFieldName };
    if (loading === 'idle' &&
      tokenLoading === LoadingState.SUCCESS
    ) {
      stCountsDispatch(fetchStCounts(dispatchProps));
    }
  }, [loading, stCountsDispatch, timeFilter, projectId, groupId, token, tokenLoading]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    const drilldownFilter = [{
      field: stFieldName,
      fieldType: FieldTypes.STRING,
      condition: FilterMatchMode.EQUALS,
      value: selectedRow[stFieldName],
    }];
    // Append timeFilterObject for last_week and last_month filters
    if (Object.keys(timeFilterObject).length !== 0) {
      const appendedFilters = [...drilldownFilter, timeFilterObject];
      setFilterList(appendedFilters);
    } else {
      setFilterList(drilldownFilter);
    }
    setTabValue(1); // Navigate to "Samples" tab
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
      { loading === LoadingState.SUCCESS && (
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
            stData={data.data}
            stDataAggregated={aggregatedCounts}
          />
        </Grid>
      </Grid>
      )}
      { loading === LoadingState.ERROR && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {data.message}
        </Alert>
      )}
      { loading === LoadingState.LOADING && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
