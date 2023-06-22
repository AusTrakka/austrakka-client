import { Card, CardContent, Grid } from '@mui/material';
import React, { useEffect } from 'react';
import SampleSummary from '../../Widgets/SampleSummary/SampleSummary';
import SubmittingOrgs from '../../Widgets/SubmittingOrgs/SubmittingOrgs';
import StCounts from '../../Widgets/StCounts/StCounts';

// TODO: Set a max card height and handle scroll voerflow
function BasicDashboard(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
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
                    groupId={groupId}
                    setFilterList={setFilterList}
                    setTabValue={setTabValue}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <StCounts
                    projectId={projectId}
                    groupId={groupId}
                    setFilterList={setFilterList}
                    setTabValue={setTabValue}
                  />
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
                  <SubmittingOrgs
                    projectId={projectId}
                    groupId={groupId}
                    setFilterList={setFilterList}
                    setTabValue={setTabValue}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  &nbsp;
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
