import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { fetchProjectsTotal } from './projectsTotalSlice';
import DrilldownButton from '../../Common/DrilldownButton';

const columns:MRT_ColumnDef<any>[] = [
  {
    header: 'Project Name',
    accessorKey: 'sampleCount',
  },
  {
    header: 'Samples uploaded',
    accessorKey: 'total',
  },
];

export default function ProjectsTotal() {
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.projectTotalState);
  const { timeFilter } = useAppSelector((state) => state.userDashboardState);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const dispatchProps = { timeFilter };
    if (loading === 'idle') {
      dispatch(fetchProjectsTotal(dispatchProps));
    }
  }, [loading, dispatch, timeFilter]);

  const navigateToProjectList = () => {
    navigate('/projects');
  };

  const rowClickHandler = (row: any) => {
    // TODO: Navigate to relevant project page
    console.log(row);
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        Project Samples
      </Typography>
      { loading === LoadingState.SUCCESS && (
      <>
        <MaterialReactTable
          columns={columns}
          data={[]}
          defaultColumn={{
            size: 0,
            minSize: 30,
          }}
          initialState={{ density: 'compact' }}
          // Stripping down features
          enableColumnActions={false}
          enableColumnFilters={false}
          enablePagination={false}
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
          muiTableContainerProps={{ sx: { maxHeight: '300px' } }}
          enableStickyHeader
        />
        <DrilldownButton
          title="View projects list"
          onClick={navigateToProjectList}
        />
      </>
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
