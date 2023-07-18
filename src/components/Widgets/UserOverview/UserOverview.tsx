import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Grid, Typography } from '@mui/material';
import { Event, FileUploadOutlined, RuleOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { fetchUserOverview } from './userOverviewSlice';

export default function UserOverview() {
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.userOverviewState);
  const { timeFilter } = useAppSelector((state) => state.userDashboardState);
  const dispatch = useAppDispatch();
  function FormatDate(dateUTC: string): string
  {
    var date = new Date(dateUTC);
    return new Intl.DateTimeFormat('en-GB', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeZoneName: "shortGeneric" }).format(date).toString()
  }
  

  useEffect(() => {
    if (loading === 'idle') {
      dispatch(fetchUserOverview());
    }
  }, [loading, dispatch, timeFilter]);
  return (
    <Box>
      <Grid container spacing={6} direction="row" justifyContent="space-between">
        { loading === LoadingState.SUCCESS && (
        <>
          <Grid item>
            <FileUploadOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Total uploaded samples
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary.main">
              {parseFloat(data.data.total).toLocaleString('en-US')}
            </Typography>
          </Grid>
          <Grid item>
            <Event color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Latest sample upload
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary">
              {
              FormatDate(data.data.latestUploadedDateUtc)
              }
            </Typography>
            
          </Grid>
          <Grid item>
            <RuleOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Records without sequences
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary">
              {parseFloat(data.data.samplesNotSequenced).toLocaleString('en-US')}
            </Typography>
          </Grid>
        </>
        )}
        { loading === LoadingState.ERROR && (
        <Grid container item>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {data.message}
          </Alert>
        </Grid>
        )}
        { loading === LoadingState.LOADING && (
        <Grid container item>
          Loading...
        </Grid>
        )}
      </Grid>
    </Box>
  );
}
