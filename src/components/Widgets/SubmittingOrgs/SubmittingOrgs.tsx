import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchSubmittingOrgs, selectAggregatedOrgs } from './sumbittingOrgsSlice';
import LoadingState from '../../../constants/loadingState';

const columns:MRT_ColumnDef<any>[] = [
  {
    header: 'Submitting organisation',
    accessorKey: 'Owner_group',
    Cell: ({ cell }: any) => <div>{cell.getValue().split('-Owner')}</div>,
  },
  {
    header: 'Sample Count',
    accessorKey: 'sampleCount',
  },
];

export default function SubmittingOrgs(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.submittingOrgsState);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const submittingOrgsDispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedOrgs);

  useEffect(() => {
    const dispatchProps = { groupId, projectId, timeFilter };
    if (loading === 'idle') {
      submittingOrgsDispatch(fetchSubmittingOrgs(dispatchProps));
    }
  }, [loading, submittingOrgsDispatch, timeFilter, projectId, groupId]);

  return (
    <Box>
      { loading === LoadingState.SUCCESS && (
        <>
          <Typography variant="h5" paddingBottom={3} color="primary">
            Submitting organisations
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
      )}
      { loading === LoadingState.ERROR && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {`An error has occurred while loading this widget - ${data.message}`}
        </Alert>
      )}
      { loading === LoadingState.LOADING && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
