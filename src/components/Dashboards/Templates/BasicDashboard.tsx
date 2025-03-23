import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import HasSeq from '../../Widgets/ProjectWidgets/HasSeq';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';

function BasicDashboard(props: ProjectDashboardTemplateProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid size={{ lg: 8, md: 12 }}>
          <Card sx={cardStyle}>
            <CardContent>
              <SampleSummary
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
          <Card sx={{ ...tallCardStyle, marginTop: 2 }}>
            <CardContent>
              <HasSeq
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ lg: 4, md: 6, xs: 8 }}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <Organisations
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
