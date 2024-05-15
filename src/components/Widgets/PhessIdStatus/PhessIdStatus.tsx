import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchPhessIdStatus, selectAggregatedPhessIdStatus } from './phessIdStatusSlice';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';
import FieldTypes from '../../../constants/fieldTypes';
import { CustomFilterOperators } from '../../DataFilters/fieldTypeOperators';

const columns = [
  { field: 'status', header: 'Status' },
  { field: 'sampleCount', header: 'Sample Count' },
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
      tokenLoading === LoadingState.SUCCESS) {
      dispatch(fetchPhessIdStatus(dispatchProps));
    }
  }, [loading, dispatch, timeFilter, projectId,
    groupId, token, tokenLoading]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    const drilldownFilter = [{
      field: 'PHESS_ID',
      fieldType: FieldTypes.STRING,
      condition: selectedRow.status === 'Missing' ?
        CustomFilterOperators.NULL_OR_EMPTY :
        CustomFilterOperators.NOT_NULL_OR_EMPTY,
      value: '',
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
