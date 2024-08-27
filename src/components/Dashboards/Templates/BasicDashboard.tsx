import { Box, Card, CardContent, Grid } from '@mui/material';
import React from 'react';
import SampleSummary from '../../Widgets/SampleSummary/SampleSummary';
import Organisations from '../../Widgets/Organisations/Organisations';

// TODO: Set a max card height and handle scroll voerflow
function BasicDashboard(props: any) {
  const {
    setTabValue,
    projectId,
    groupId,
  } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item lg={8} md={12}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
            <CardContent>
              <SampleSummary
                projectId={projectId}
                groupId={groupId}
                setTabValue={setTabValue}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={4} md={6} xs={8}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
            <CardContent>
              <Organisations
                projectId={projectId}
                groupId={groupId}
                setTabValue={setTabValue}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
export default BasicDashboard;
