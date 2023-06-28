import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchSubmittingOrgs, selectAggregatedOrgs } from './sumbittingOrgsSlice';
import LoadingState from '../../../constants/loadingState';

const submittingOrgFieldName = 'Owner_group';

const columns:MRT_ColumnDef<any>[] = [
  {
    header: 'Submitting organisation',
    accessorKey: submittingOrgFieldName,
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

  const rowClickHandler = (row: any) => {
    const selectedRow = row.original;
    setFilterList(
      [
        {
          field: submittingOrgFieldName,
          fieldType: 'string',
          condition: '==*',
          value: selectedRow.Owner_group,
        },
      ],
    );
    setTabValue(1); // Navigate to "Samples" tab
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        Submitting organisations
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
