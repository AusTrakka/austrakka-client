import React, { useEffect } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
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
  const { timeFilter, timeFilterObject } = useAppSelector((state) => state.projectDashboardState);

  // Drilldown filters
  const allSamplesFilter: any [] = [];
  const hasSequenceFilter = [
    {
      field: 'hasSequence',
      fieldType: 'string',
      condition: '==*',
      value: 'false',
    },
  ];
  const latestUploadFilter = [
    {
      field: 'Uploaded',
      fieldType: 'date',
      condition: '>',
      value: dayjs(), // TODO: Convert data.data.latestUploadedDate to dayjs object
    },
  ];

  useEffect(() => {
    if (loading === 'idle') {
      sampleSummaryDispatch(fetchSummary(timeFilter));
    }
  }, [loading, sampleSummaryDispatch, timeFilter]);

  const handleDrilldownFilters = (drilldownFilters: any) => {
    // TODO: Don't append time filter for latest upload drilldown
    // Only append timeFilterObject if it actually contains a filter
    if (Object.keys(timeFilterObject).length !== 0) {
      const appendedFilters = [...drilldownFilters, timeFilterObject];
      setFilterList(appendedFilters);
    } else {
      setFilterList(drilldownFilters);
    }
    setTabValue(1);
  };

  return (
    <Box>
      { loading === LoadingState.SUCCESS ? (
        <Grid container spacing={2} direction="row" justifyContent="space-between">
          <Grid item>
            <Typography variant="h5" paddingBottom={1} color="primary.main">
              Total uploaded samples
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary.main">
              {parseFloat(data.data.total).toLocaleString('en-US')}
            </Typography>
            <Button size="small" onClick={() => handleDrilldownFilters(allSamplesFilter)}>
              View samples
            </Button>
          </Grid>
          <Grid item>
            <Typography variant="h5" paddingBottom={1} color="primary.main">
              Latest sample upload
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary.main">
              {data.data.latestUploadedDate}
            </Typography>
            <Button size="small" onClick={() => handleDrilldownFilters(latestUploadFilter)}>
              View samples
            </Button>
          </Grid>
          <Grid item>
            <Typography variant="h5" paddingBottom={1} color="primary.main">
              Records without sequences
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary.main">
              {parseFloat(data.data.samplesNotSequenced).toLocaleString('en-US')}
            </Typography>
            <Button size="small" onClick={() => handleDrilldownFilters(hasSequenceFilter)}>
              View samples
            </Button>
          </Grid>
        </Grid>
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
