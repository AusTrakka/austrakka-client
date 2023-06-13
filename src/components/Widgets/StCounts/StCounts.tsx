import React, { useEffect, useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchStCounts, selectAggregatedStCounts, selectStCounts } from './stCountsSlice';
import LoadingState from '../../../constants/loadingState';

export default function StCounts() {
  // Get initial state from store
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, loading } = useAppSelector(selectStCounts);
  const aggregatedCounts = useAppSelector(selectAggregatedStCounts);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);

  // TODO: Create custome selector to derive data in correct format
  //   const data = useAppSelector(state => {
  //     const initialData = state.submittingLabsState.data;
  //     const aggregatedData = initialData;
  //     return aggregatedData;
  //   });

  const stCountsDispatch = useAppDispatch();

  useEffect(() => {
    if (loading === 'idle') {
      stCountsDispatch(fetchStCounts(timeFilter));
    }
  }, [loading, stCountsDispatch, timeFilter]);

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'stValue',
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
    <Box>
      { loading === LoadingState.SUCCESS ? (
        <>
          <Typography variant="h4" paddingBottom={3}>
            ST Counts
          </Typography>
          <Grid container direction="row" alignItems="center" spacing={4}>
            <Grid item>
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
            <Grid item>
              {/* TODO: Draw plot from data */}
              Plot
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
