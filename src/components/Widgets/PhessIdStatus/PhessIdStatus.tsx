import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchPhessIdStatus, selectAggregatedPhessIdStatus } from './phessIdStatusSlice';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

const columns = [
  { field: 'status', header: 'Status' },
  { field: 'sampleCount', header: 'Sample Count' },
];

export default function PhessIdStatus(props: any) {
  const {
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.phessIdStatusState);
  const { timeFilter, timeFilterObject } = useAppSelector((state) => state.projectDashboardState);
  const dispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedPhessIdStatus);
  const { token, tokenLoading } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const dispatchProps = { groupId, token, projectId, timeFilter };
    if (loading === 'idle' &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchPhessIdStatus(dispatchProps));
    }
  }, [loading, dispatch, timeFilter, projectId,
    groupId, token, tokenLoading]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    const drillDownFilter: DataTableFilterMeta = {
      PHESS_ID: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.CUSTOM,
            value: selectedRow.status === 'Missing',
          },
        ],
      },
    };
    // Append timeFilterObject for last_week and last_month filters
    if (Object.keys(timeFilterObject).length !== 0) {
      const appendedFilters : DataTableFilterMeta = {
        ...drillDownFilter,
        ...timeFilterObject,
      };
      updateTabUrlWithSearch(navigate, '/samples', appendedFilters);
    } else {
      updateTabUrlWithSearch(
        navigate,
        '/samples',
        drillDownFilter,
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        PHESS ID Status
      </Typography>
      { loading === LoadingState.SUCCESS && (
      <DataTable
        value={aggregatedCounts}
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
