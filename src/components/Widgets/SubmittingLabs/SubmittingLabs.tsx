import React, { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchSubmittingLabs } from './sumbittingLabsSlice';
import { useFirstRender } from '../../../utilities/helperUtils';
import LoadingState from '../../../constants/loadingState';

export default function SubmittingLabs() {
  // Get initial state from store
  const { data, loading } = useAppSelector((state) => state.submittingLabsState);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const submittingLabsDispatch = useAppDispatch();

  useEffect(() => {
    if (loading === 'idle') {
      submittingLabsDispatch(fetchSubmittingLabs(timeFilter));
    }
  }, [loading, submittingLabsDispatch, timeFilter]);

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'orgName',
        header: 'Lab',
      },
      {
        accessorKey: 'samplesUploaded',
        header: 'Samples uploaded',
      },
    ],
    [],
  );

  return (
    <Box>
      { loading === LoadingState.SUCCESS ? (
        <>
          <Typography variant="h4" paddingBottom={3}>
            Submitting labs
          </Typography>
          <MaterialReactTable
            columns={columns}
            data={data.data}
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
        </>
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
