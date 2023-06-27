import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchPhessIdStatus, selectAggregatedPhessIdStatus } from './phessIdStatusSlice';
import LoadingState from '../../../constants/loadingState';

const columns:MRT_ColumnDef<any>[] = [
  {
    header: 'Status',
    accessorKey: 'status',
  },
  {
    header: 'Sample Count',
    accessorKey: 'sampleCount',
  },
];

export default function PhessIdStatus(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  const { loading } = useAppSelector((state) => state.phessIdStatusState);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const dispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedPhessIdStatus);

  useEffect(() => {
    const dispatchProps = { groupId, projectId, timeFilter };
    if (loading === 'idle') {
      dispatch(fetchPhessIdStatus(dispatchProps));
    }
  }, [loading, dispatch, timeFilter, projectId, groupId]);

  return (
    <Box>
      { loading === LoadingState.SUCCESS ? (
        <>
          <Typography variant="h5" paddingBottom={3} color="primary">
            PHESS Id Status
          </Typography>
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
        </>
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
