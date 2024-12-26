import { Box, Card, CardContent } from '@mui/material';
import React from 'react';
import Grid from '@mui/material/Grid2';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import AccessionCounts from '../../Widgets/ProjectWidgets/AccessionCounts';
import DateCollCounts from '../../Widgets/ProjectWidgets/DateCollCount';

function BasicDashboard(props: ProjectDashboardTemplateProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;

  const cardStyle = {
    padding: 1,
    border: 'none',
    boxShadow: 'none',
  };

  const tallCardStyle = {
    ...cardStyle,
    minHeight: 300,
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* First Row: Single Grid spanning the entire row */}
        <Grid size={12}>
          <Card sx={cardStyle}>
            <CardContent>
              <SampleSummary
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Second Row: Two Grids sharing 70% and 25% */}
        <Grid size={9}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <EpiCurveChart
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={3}>
          <Card sx={{ ...tallCardStyle, height: '100%' }}>
            <CardContent>
              <Organisations
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Third Row: Two Grids sharing approximately 1/3 and 2/3 */}
        <Grid size={4}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <DateCollCounts
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={8}>
          <Card sx={tallCardStyle}>
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
