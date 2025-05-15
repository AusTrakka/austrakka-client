import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Event, FileUploadOutlined, RuleOutlined } from '@mui/icons-material';
import LoadingState from '../../../../constants/loadingState';
import { useApi } from '../../../../app/ApiContext';
import { formatDateAsTwoStrings } from '../../../../utilities/dateUtils';
import { ResponseObject } from '../../../../types/responseObject.interface';
import { getUserDashboardOverview } from '../../../../utilities/resourceUtils';
import { ResponseType } from '../../../../constants/responseType';
import { UserDashboardOverview } from '../../../../types/dtos';

export default function UserOverview() {
  const { token, tokenLoading } = useApi();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalSamples, setTotalSamples] = useState<number>(0);
  const [samplesWithoutSequences, setSamplesWithoutSequences] = useState<number>(0);
  const [latestUploadDate, setLatestUploadDate] = useState<string>('');

  useEffect(() => {
    async function getOverview() {
      const overviewResponse: ResponseObject<UserDashboardOverview> =
        await getUserDashboardOverview(token);
      if (overviewResponse?.status === ResponseType.Success) {
        setTotalSamples(overviewResponse.data?.total ?? 0);
        setSamplesWithoutSequences(overviewResponse.data?.samplesNotSequenced ?? 0);
        setLatestUploadDate(overviewResponse.data?.latestUploadedDateUtc ?? '');
      } else {
        setErrorMessage(overviewResponse.message ?? 'An error occurred loading data');
      }
      setIsLoading(false);
    }

    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      getOverview();
    }
  }, [token, tokenLoading]);
  
  return (
    <Box>
      <Grid container spacing={2} direction="row" justifyContent="space-between">
        { isLoading || errorMessage != null || (
        <>
          <Grid>
            <FileUploadOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Total viewable samples
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary.main">
              {totalSamples.toLocaleString('en-US')}
            </Typography>
          </Grid>
          <Grid>
            <Event color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Latest sample upload
            </Typography>
            {latestUploadDate ? (
              <>
                <Typography variant="h2" paddingBottom={1} color="primary">
                  {formatDateAsTwoStrings(latestUploadDate)[0]}
                </Typography>
                <Typography variant="subtitle2" paddingBottom={1} color="primary">
                  {formatDateAsTwoStrings(latestUploadDate)[1]}
                </Typography>
              </>
            ) : (
              <Typography variant="h2" paddingBottom={1} color="primary">
                -
              </Typography>
            )}
          </Grid>
          <Grid>
            <RuleOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Records without sequences
            </Typography>
            <Typography variant="h2" paddingBottom={1} color="primary">
              {samplesWithoutSequences.toLocaleString('en-US')}
            </Typography>
          </Grid>
        </>
        )}
      </Grid>
      { errorMessage != null && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      { isLoading && errorMessage == null && (
        <Typography>
          Loading...
        </Typography>
      )}
    </Box>
  );
}
