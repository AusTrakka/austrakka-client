import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import LoadingState from '../../../../constants/loadingState';
import DrilldownButton from '../../../Common/DrilldownButton';
import { fetchPhessIdOverall } from './phessIdOverallSlice';
import { useApi } from '../../../../app/ApiContext';

const columns = [
  { field: 'projectName', header: 'Project Name' },
  { field: 'total', header: 'PHESS ID Missing' },
];

export default function PhessIdOverall() {
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.phessIdOverallState);
  const { timeFilter } = useAppSelector((state) => state.userDashboardState);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    if (loading === 'idle' &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchPhessIdOverall(token));
    }
  }, [loading, dispatch, timeFilter, tokenLoading, token]);

  const navigateToProjectList = () => {
    navigate('/projects');
  };

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    navigate(`/projects/${selectedRow.abbrev}`);
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        PHESS ID Status
      </Typography>
      { loading === LoadingState.SUCCESS && (
      <>
        <DataTable
          value={data.data}
          size="small"
          onRowClick={rowClickHandler}
          selectionMode="single"
        >
          {columns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
            />
          ))}
        </DataTable>
        <br />
        <DrilldownButton
          title="View all projects"
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
