import React, { useEffect, useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { VegaLite } from 'react-vega';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchStCounts, selectAggregatedStCounts, selectStCounts } from './stCountsSlice';
import LoadingState from '../../../constants/loadingState';
import testData from './testStData';

function STChart() {
  const initSelect = () => {
    const copy = testData.map((item) => ({
      ...item,
    }));
    return copy;
  };

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 500,
    // height: 'container',
    data: {
      values: initSelect(),
    },
    mark: { type: 'bar', tooltip: true, stroke: 'black', cursor: 'pointer' },
    params: [
      {
        name: 'stValue',
        select: { type: 'point', fields: ['stValue'] },
        bind: 'legend',
      },
      {
        name: 'hover',
        select: { type: 'point', on: 'mouseover', clear: 'mouseout' },
      },
    ],
    config: {
      legend: {
        symbolStrokeWidth: 0,
      },
    },
    encoding: {
      x: { timeUnit: 'month', field: 'created', type: 'temporal', title: 'Sample created date (month)' },
      y: { aggregate: 'count', title: 'Count of Samples' },
      color: { field: 'stValue', title: 'ST Value' },
      opacity: {
        condition: { param: 'stValue', value: 1 },
        value: 0.2,
      },
      strokeWidth: {
        condition: [
          {
            param: 'hover',
            empty: false,
            value: 1,
          },
        ],
        value: 0,
      },
    },
  };

  return (
    <Box>
      <VegaLite
        spec={spec}
        actions={false}
        renderer="svg"
      />
    </Box>
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
  const aggregatedCounts = useAppSelector(selectAggregatedStCounts);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);

  const stCountsDispatch = useAppDispatch();

  useEffect(() => {
    const dispatchProps = { groupId, projectId, timeFilter };
    if (loading === 'idle') {
      stCountsDispatch(fetchStCounts(dispatchProps));
    }
  }, [loading, stCountsDispatch, timeFilter, projectId, groupId]);

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'ST',
        header: 'ST Value',
      },
      {
        accessorKey: 'sampleCount',
        header: 'Sample count',
      },
    ],
    [],
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      { loading === LoadingState.SUCCESS ? (
        <>
          <Typography variant="h4" paddingBottom={3}>
            ST Counts
          </Typography>
          <Grid container direction="row" alignItems="center" spacing={4}>
            <Grid item xs="auto">
              <MaterialReactTable
                columns={columns}
                data={aggregatedCounts}
                defaultColumn={{
                  size: 0,
                  minSize: 30,
                }}
                initialState={{ density: 'compact' }}
                // Stripping down features
                enableColumnActions={false}
                enableColumnFilters={false}
                enablePagination={false}
                enableSorting={false}
                enableBottomToolbar={false}
                enableTopToolbar={false}
                muiTableBodyRowProps={{ hover: false }}
                muiTablePaperProps={{
                  sx: {
                    boxShadow: 'none',
                  },
                }}
              />
            </Grid>
            <Grid item xs>
              <STChart data={data} />
            </Grid>
          </Grid>
        </>
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
