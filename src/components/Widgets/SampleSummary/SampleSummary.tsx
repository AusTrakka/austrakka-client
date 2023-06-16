import React, { useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Event, FileUploadOutlined, RuleOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchSummary } from './sampleSummarySlice';
import LoadingState from '../../../constants/loadingState';
import DrilldownButton from '../../Common/DrilldownButton';

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
        <Grid container spacing={6} direction="row" justifyContent="space-between">
          <Grid item>
            <FileUploadOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Total uploaded samples
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary.main">
              {parseFloat(data.data.total).toLocaleString('en-US')}
            </Typography>
            <DrilldownButton
              title="View Samples"
              onClick={() => handleDrilldownFilters(allSamplesFilter)}
            />
          </Grid>
          <Grid item>
            <Event color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Latest sample upload
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary">
              {data.data.latestUploadedDate}
            </Typography>
            <DrilldownButton
              title="View Samples"
              onClick={() => handleDrilldownFilters(latestUploadFilter)}
            />
          </Grid>
          <Grid item>
            <RuleOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Records without sequences
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary">
              {parseFloat(data.data.samplesNotSequenced).toLocaleString('en-US')}
            </Typography>
            <DrilldownButton
              title="View Samples"
              onClick={() => handleDrilldownFilters(hasSequenceFilter)}
            />
          </Grid>
        </Grid>
      )
        : (
          'Loading...'
        )}
    </Box>
  );
}
