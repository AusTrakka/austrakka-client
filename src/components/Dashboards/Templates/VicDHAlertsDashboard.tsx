import { Card, CardContent, Grid } from '@mui/material';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import PhessIdStatus from '../../Widgets/ProjectWidgets/PhessIdStatus';
import ThresholdAlerts from '../../Widgets/ProjectWidgets/ThresholdAlerts';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';

function VicDHAlertsDashboard(props: ProjectDashboardTemplateProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;

  return (
    <Grid container spacing={2}>
      <Grid item xl={8} md={12}>
        <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
          <CardContent>
            <SampleSummary
              projectAbbrev={projectAbbrev}
              filteredData={filteredData}
              timeFilterObject={timeFilterObject}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xl={4} md={3}>
        <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
          <CardContent>
            <PhessIdStatus
              projectAbbrev={projectAbbrev}
              filteredData={filteredData}
              timeFilterObject={timeFilterObject}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xl={3} md={4}>
        <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
          <CardContent>
            <Organisations
              projectAbbrev={projectAbbrev}
              filteredData={filteredData}
              timeFilterObject={timeFilterObject}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xl={5} md={5}>
        <Card sx={{ padding: 1, border: 'none', boxShadow: 'none', maxHeight: '70vh', overflow: 'auto' }}>
          <CardContent>
            <ThresholdAlerts
              projectAbbrev={projectAbbrev}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
export default VicDHAlertsDashboard;
