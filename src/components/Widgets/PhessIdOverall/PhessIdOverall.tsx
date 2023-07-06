import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import DrilldownButton from '../../Common/DrilldownButton';
import { fetchPhessIdOverall } from './phessIdOverallSlice';

const columns:MRT_ColumnDef<any>[] = [
  {
    header: 'Project Name',
    accessorKey: 'projectName',
  },
  {
    header: 'PHESS ID Missing',
    accessorKey: 'total',
  },
];

export default function PhessIdOverall() {
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.phessIdOverallState);
  const { timeFilter } = useAppSelector((state) => state.userDashboardState);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading === 'idle') {
      dispatch(fetchPhessIdOverall());
    }
  }, [loading, dispatch, timeFilter]);

  const navigateToProjectList = () => {
    navigate('/projects');
  };

  const rowClickHandler = (row: any) => {
    const selectedRow = row.original;
    navigate(`/projects/${selectedRow.abbrev}`);
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        PHESS ID Status
      </Typography>
      { loading === LoadingState.SUCCESS && (
      <>
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
          muiTableContainerProps={{ sx: { maxHeight: '400px' } }}
          enableStickyHeader
        />
        <br />
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
