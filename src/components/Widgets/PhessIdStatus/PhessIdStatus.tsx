import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchPhessIdStatus, selectAggregatedPhessIdStatus } from './phessIdStatusSlice';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';

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
  const { loading, data } = useAppSelector((state) => state.phessIdStatusState);
  const { timeFilter, timeFilterObject } = useAppSelector((state) => state.projectDashboardState);
  const dispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedPhessIdStatus);
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    const dispatchProps = { groupId, token, projectId, timeFilter };
    if (loading === 'idle' &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchPhessIdStatus(dispatchProps));
    }
  }, [loading, dispatch, timeFilter, projectId,
    groupId, token, tokenLoading]);

  const rowClickHandler = (row: any) => {
    const selectedRow = row.original;
    const drilldownFilter = [{
      field: 'PHESS_ID',
      fieldType: 'string',
      condition: selectedRow.status === 'Missing' ? '=NULL' : '!=NULL',
      value: 'null-or-empty',
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

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        PHESS ID Status
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
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row),
          sx: {
            cursor: 'pointer',
          },
        })}
        muiTablePaperProps={{
          sx: {
            boxShadow: 'none',
          },
        }}
        enableStickyHeader
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
