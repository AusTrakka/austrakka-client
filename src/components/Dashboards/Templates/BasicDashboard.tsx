import { Card, CardContent, Grid } from '@mui/material';
import React, { useEffect } from 'react';
import SampleSummary from '../../Widgets/SampleSummary/SampleSummary';
import SubmittingLabs from '../../Widgets/SubmittingLabs/SubmittingLabs';
import StCounts from '../../Widgets/StCounts/StCounts';

// TODO: Set a max card height and handle scroll voerflow
function BasicDashboard(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
  } = props;
  useEffect(() => {

  }, []);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <SampleSummary
                    projectId={projectId}
                    setFilterList={setFilterList}
                    setTabValue={setTabValue}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <StCounts />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <SubmittingLabs />
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <SubmittingLabs />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} />
    </>
  );
}
export default BasicDashboard;
