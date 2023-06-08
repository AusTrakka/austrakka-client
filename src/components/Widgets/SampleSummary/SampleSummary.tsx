import React, { useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchSummary } from './sampleSummarySlice';
import LoadingState from '../../../constants/loadingState';
import { useFirstRender } from '../../../utilities/helperUtils';

export default function SampleSummary() {
  // Get initial state from store
  const { data, loading } = useAppSelector((state) => state.sampleSummaryState);
  const sampleSummaryDispatch = useAppDispatch();
  const { timeFilter } = useAppSelector((state) => state.projectDashboardState);
  const firstRender = useFirstRender();

  useEffect(() => {
    if (loading === 'idle') {
      sampleSummaryDispatch(fetchSummary(timeFilter));
    }
  }, [loading, sampleSummaryDispatch, timeFilter]);

  /// TESTING
  useEffect(() => {
    if (!firstRender) {
      sampleSummaryDispatch(fetchSummary(timeFilter));
    }
  }, [firstRender, sampleSummaryDispatch, timeFilter]);
  ///
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
        </Grid>
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
