import React, { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchSubmittingOrgs, selectAggregatedOrgs } from './sumbittingOrgsSlice';
import LoadingState from '../../../constants/loadingState';

export default function SubmittingOrgs(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  const { loading } = useAppSelector((state) => state.submittingOrgsState);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const submittingOrgsDispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedOrgs);

  useEffect(() => {
    const dispatchProps = { groupId, projectId, timeFilter };
    if (loading === 'idle') {
      submittingOrgsDispatch(fetchSubmittingOrgs(dispatchProps));
    }
  }, [loading, submittingOrgsDispatch, timeFilter, projectId, groupId]);

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'Owner_group',
        header: 'Lab',
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
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
