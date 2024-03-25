import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { fetchProjectsTotal } from './projectsTotalSlice';
import DrilldownButton from '../../Common/DrilldownButton';
import { isoDateLocalDate } from '../../../utilities/helperUtils';
import { useApi } from '../../../app/ApiContext';

const columns = [
  { field: 'projectName', header: 'Project Name' },
  { field: 'total', header: 'Samples uploaded' },
  { field: 'latestDateCreated', header: 'Latest sample created', body: (rowData: any) => isoDateLocalDate(rowData.latestDateCreated) },
];

export default function ProjectsTotal() {
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.projectTotalState);
  const { timeFilter } = useAppSelector((state) => state.userDashboardState);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading === 'idle' &&
    tokenLoading !== LoadingState.IDLE &&
    tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchProjectsTotal(token));
    }
  }, [loading, dispatch, timeFilter, token, tokenLoading]);

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
        Project Samples
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
              body={col.body}
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
