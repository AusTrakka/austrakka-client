import { Box, Card, CardContent, Grid } from '@mui/material';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import AccessionCounts from '../../Widgets/ProjectWidgets/AccessionCounts';

// TODO: Set a max card height and handle scroll voerflow
function BasicDashboard(props: ProjectDashboardTemplateProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;
  
  // Simplified layout: summary widget and epi curve widget always full width,
  // with organisations and accession counts widgets side by side below
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item lg={12}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
            <CardContent>
              <SampleSummary
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
          <Card sx={{ padding: 1, border: 'none', marginTop: 2, boxShadow: 'none' }}>
            <CardContent>
              <EpiCurveChart
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={4} md={4} xs={12}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none', minHeight: 300 }}>
            <CardContent>
              <Organisations
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={8} md={8} xs={12}>
          <Card sx={{ padding: 1, border: 'none', boxShadow: 'none', minHeight: 300 }}>
            <CardContent>
              <AccessionCounts
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
export default BasicDashboard;
