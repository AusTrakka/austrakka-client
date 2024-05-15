import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchQcStatus, selectAggregatedQcStatus } from './qcStatusSlice';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';

const columns = [
  { field: 'Qc_status', header: 'Status' },
  { field: 'sampleCount', header: 'Sample Count' },
];

export default function QcStatus(props: any) {
  const {
    // setFilterList,
    // setTabValue,
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.qcStatusState);
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedQcStatus);

  useEffect(() => {
    const dispatchProps = { groupId, token, projectId, timeFilter };
    if (loading === 'idle' &&
        tokenLoading === LoadingState.SUCCESS
    ) {
      dispatch(fetchQcStatus(dispatchProps));
    }
  }, [loading, dispatch, timeFilter, projectId,
    groupId, token, tokenLoading]);

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        QC Status
      </Typography>
      { loading === LoadingState.SUCCESS && (
      <DataTable
        value={aggregatedCounts}
        size="small"
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
