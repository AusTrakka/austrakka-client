import React, { useEffect } from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchThresholdAlerts, selectThresholdAlerts } from './thresholdAlertsSlice';
import LoadingState from '../../../constants/loadingState';
import ThresholdAlert from './ThresholdAlert';
import { ThresholdAlertDTO } from '../../../types/dtos';
import { useApi } from '../../../app/ApiContext';

export default function ThresholdAlerts(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
  } = props;

  const { loading, data } = useAppSelector(selectThresholdAlerts);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const dispatchProps = { groupId, token, projectId };
    if (loading === 'idle' &&
      tokenLoading === LoadingState.SUCCESS) {
      dispatch(fetchThresholdAlerts(dispatchProps));
    }
  }, [loading, dispatch, projectId,
    groupId, token, tokenLoading]);

  // Descending severity, then alphabetical by category, then by descending recent count
  const sortAlerts = (a: ThresholdAlertDTO, b: ThresholdAlertDTO) => {
    if (a.alertLevelOrder !== b.alertLevelOrder) { return b.alertLevelOrder - a.alertLevelOrder; }
    if (b.categoryField !== a.categoryField) return a.categoryField.localeCompare(b.categoryField);
    if (a.recentCount !== b.recentCount) return b.recentCount - a.recentCount;
    // For now no sort on ratio
    return 0;
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={1} color="primary">
        Threshold exceedances (6wk/5yr)
      </Typography>
      { loading === LoadingState.ERROR && (
        <Alert severity="error">
          {`Cannot calculate exceedance alerts: ${data.message}`}
        </Alert>
      )}
      {
        loading === LoadingState.SUCCESS && (
        <Stack spacing={1}>
          {
            // Sort by order, descending
            data.data.slice()
              .sort((a: ThresholdAlertDTO, b:ThresholdAlertDTO) => sortAlerts(a, b))
              .map((alertRow: ThresholdAlertDTO) => (
                <ThresholdAlert {...{ alertRow, setFilterList, setTabValue }} />
              ))
          }
        </Stack>
        )
}
      { loading === LoadingState.LOADING && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
