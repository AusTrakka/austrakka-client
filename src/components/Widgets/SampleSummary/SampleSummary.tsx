import React, { useEffect } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchSummary } from './sampleSummarySlice';
import LoadingState from '../../../constants/loadingState';

export default function SampleSummary(props: any) {
  const {
    setFilterList,
    setTabValue,
  } = props;
  // Get initial state from store
  const { data, loading } = useAppSelector((state) => state.sampleSummaryState);
  const sampleSummaryDispatch = useAppDispatch();
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const filters = [
    {
      field: 'cgMLST',
      fieldType: 'string',
      condition: '==*',
      value: '2',
    },
  ];

  useEffect(() => {
    if (loading === 'idle') {
      sampleSummaryDispatch(fetchSummary(timeFilter));
    }
  }, [loading, sampleSummaryDispatch, timeFilter]);

  return (
    <Box>
      { loading === LoadingState.SUCCESS ? (
        <Grid container spacing={2} direction="row" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" paddingBottom={1}>
              Total uploaded samples
            </Typography>
            {data.data.total}
          </Grid>
          <Grid item>
            <Typography variant="h4" paddingBottom={1}>
              Latest sample upload
            </Typography>
            {data.data.latestUploadedDate}
          </Grid>
          <Grid item>
            <Typography variant="h4" paddingBottom={1}>
              Samples recieved, not sequenced
            </Typography>
            {data.data.samplesNotSequenced}
          </Grid>
          <Button variant="contained" onClick={() => { setFilterList(filters); setTabValue(1); }}>
            Update query string
          </Button>
        </Grid>
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
