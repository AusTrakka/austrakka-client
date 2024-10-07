import React, {useEffect, useState} from 'react';
import {Alert, Box, Stack, Typography} from '@mui/material';
import {useAppSelector} from '../../../app/store';
import ThresholdAlertRow from './ThresholdAlertRow';
import {calculateAlertList, ThresholdAlert} from '../../../utilities/thresholdAlertUtils';
import {ThresholdAlertFields} from '../../../constants/thresholdAlertConstants';
import {ProjectMetadataState, selectProjectMetadata} from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';

// Threshold alerts use historical data and do not pay attention to dashboard time filter

const ALERT_CATEGORY_FIELD = 'Serotype';

export default function ThresholdAlerts(props: any) {
  const {
    projectAbbrev,
  } = props;
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<ThresholdAlert[]>([]);

  useEffect(() => {
    if (data?.loadingState === MetadataLoadingState.DATA_LOADED) {
      const missingFields = Object.values(ThresholdAlertFields).filter(
        field => !data!.fields!.some(fld => fld.columnName === field),
      );
      if (missingFields.length > 0) {
        setErrorMessage(`Fields ${missingFields.join(', ')} not found in project`);
      } else {
        const { alerts: newAlerts, errorMessage: newErrorMessage } = calculateAlertList(
          ALERT_CATEGORY_FIELD,
          new Date(),
          6,
          5,
          data!.metadata || [],
        );
        setAlerts(newAlerts);
        if (newErrorMessage) {
          setErrorMessage(newErrorMessage);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.loadingState]);
  
  useEffect(() => {
    if (data?.errorMessage) {
      setErrorMessage(`Cannot calculate exceedance alerts: ${data.errorMessage}`);
    }
  }, [data?.errorMessage]);
  
  return (
    <Box>
      <Typography variant="h5" paddingBottom={1} color="primary">
        Threshold exceedances (6wk/5yr)
      </Typography>
      { errorMessage && (
        <Alert severity="error">
          {errorMessage}
        </Alert>
      )}
      {
        data?.loadingState === MetadataLoadingState.DATA_LOADED && (
        <Stack spacing={1}>
          {
            alerts.map((alert) =>
              <ThresholdAlertRow alertRow={alert} />)
          }
        </Stack>
        )
}
      { (!data?.loadingState ||
        !(data.loadingState === MetadataLoadingState.DATA_LOADED ||
          data.loadingState === MetadataLoadingState.ERROR ||
          data.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR)) && (
          <div>Loading...</div>
      )}
    </Box>
  );
}
