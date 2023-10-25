import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchQcStatus, selectAggregatedQcStatus } from './qcStatusSlice';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';

const columns:MRT_ColumnDef<any>[] = [
  {
    header: 'Status',
    accessorKey: 'Qc_status',
  },
  {
    header: 'Sample Count',
    accessorKey: 'sampleCount',
  },
];

export default function QcStatus(props: any) {
  const {
    // setFilterList,
    // setTabValue,
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.qcStatusState);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedQcStatus);

  useEffect(() => {
    const dispatchProps = { groupId, token, projectId, timeFilter };
    if (loading === 'idle' &&
        tokenLoading !== LoadingState.IDLE &&
        tokenLoading !== LoadingState.LOADING
    ) {
      dispatch(fetchQcStatus(dispatchProps));
    }
  }, [loading, dispatch, timeFilter, projectId,
    groupId, token, tokenLoading]);

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        QC Status
      </Typography>
      { loading === LoadingState.SUCCESS && (
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
