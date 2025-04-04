import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Event, FileUploadOutlined, RuleOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../../../../constants/loadingState';
import { useApi } from '../../../../app/ApiContext';
import { formatDate } from '../../../../utilities/dateUtils';
import { Project } from '../../../../types/dtos';
import { ResponseObject } from '../../../../types/responseObject.interface';
import { getProjectList } from '../../../../utilities/resourceUtils';
import { ResponseType } from '../../../../constants/responseType';

export default function UserOverview() {
  // Get initial state from store
  const { token, tokenLoading } = useApi();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getProjects() { // TODO maybe move to utility?
      const projectResponse: ResponseObject = await getProjectList(token);
      if (projectResponse.status === ResponseType.Success) {
        setProjects(projectResponse.data);
      } else {
        setErrorMessage(projectResponse.error);
      }
      setIsLoading(false);
    }

    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      getProjects();
    }
  }, [token, tokenLoading]);

  // Derived state variables
  const totalSamples = projects.reduce((acc, project) => acc + project.sampleCount, 0);
  const latestUploadDate = projects.reduce((latest, project) => {
    const latestDate = project.latestSampleDate;
    return latestDate > latest ? latestDate : latest;
  }, '');
  const samplesWithSequences = projects.reduce(
    (acc, project) => acc + project.sequencedSampleCount,
    0,
  );
  const samplesWithoutSequences = totalSamples - samplesWithSequences;
  
  return (
    <Box>
      <Grid container spacing={2} direction="row" justifyContent="space-between">
        { isLoading || errorMessage != null || (
        <>
          <Grid>
            <FileUploadOutlined color="primary" />
            <Typography variant="h5" paddingBottom={1} color="primary">
              Total uploaded samples
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
            <Typography variant="h2" paddingBottom={1} color="primary">
              { latestUploadDate ? formatDate(latestUploadDate) : '-'}
            </Typography>

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
        { isLoading && (
          <Typography>
            Loading...
          </Typography>
        )}
    </Box>
  );
}
