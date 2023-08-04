import { Card, CardContent, Grid } from '@mui/material';
import React from 'react';
import SampleSummary from '../../Widgets/SampleSummary/SampleSummary';
import Organisations from '../../Widgets/Organisations/Organisations';
import PhessIdStatus from '../../Widgets/PhessIdStatus/PhessIdStatus';
import ThresholdAlerts from '../../Widgets/ThresholdAlerts/ThresholdAlerts';

function VicDHAlertsDashboard(props: any) {
  const {
    setFilterList,
    setTabValue,
    projectId,
    groupId,
  } = props;

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xl={8} md={12}>
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
        <Grid item xl={4} md={4}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
            <CardContent>
              <PhessIdStatus
                projectId={projectId}
                groupId={groupId}
                setFilterList={setFilterList}
                setTabValue={setTabValue}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xl={4} md={4}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
            <CardContent>
              <Organisations
                projectId={projectId}
                groupId={groupId}
                setFilterList={setFilterList}
                setTabValue={setTabValue}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xl={4} md={4}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
            <CardContent>
              <ThresholdAlerts
                projectId={projectId}
                groupId={groupId}
                setFilterList={setFilterList}
                setTabValue={setTabValue}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
export default VicDHAlertsDashboard;
