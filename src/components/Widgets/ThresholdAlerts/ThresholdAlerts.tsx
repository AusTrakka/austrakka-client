import React, { useEffect } from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchThresholdAlerts, selectThresholdAlerts } from './thresholdAlertsSlice';
import LoadingState from '../../../constants/loadingState';
import ThresholdAlert from './ThresholdAlert';
import { ThresholdAlertDTO } from '../../../types/dtos';

const fakeData: ThresholdAlertDTO[] = [
  {alertLevelOrder: 0,
    alertLevel: "No Alert",
    categoryField: "Serotype",
    categoryValue: "Enteritidis",
    ratio: null},
  {alertLevelOrder: 3,
    alertLevel: "Investigate",
    categoryField: "Serotype",
    categoryValue: "Hvittingfoss",
    ratio: 7.0} 
  ]

export default function ThresholdAlerts(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
  } = props;

  const { loading, data } = useAppSelector(selectThresholdAlerts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const dispatchProps = { groupId, projectId, };
    if (loading === 'idle') {
      dispatch(fetchThresholdAlerts(dispatchProps));
    }
  }, [loading, dispatch, projectId, groupId]);

  return (
    <Box>
      <Typography variant="h5" paddingBottom={1} color="primary">
        Threshold exceedances
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
              .sort((a: ThresholdAlertDTO, b:ThresholdAlertDTO) => 
                b.alertLevelOrder - a.alertLevelOrder)
              .map((alertRow: ThresholdAlertDTO) => (
                <ThresholdAlert { ...{alertRow, setFilterList,setTabValue} } />
            ))
          }
        </Stack>
      )}
      { loading === LoadingState.LOADING && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
