import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import MetadataCounts from '../../Widgets/ProjectWidgets/MetadataCount';
import OrgHasSeq from '../../Widgets/ProjectWidgets/OrgHasSeq';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';

// TODO: Set a max card height and handle scroll overflow
function DefaultDashboard(props: ProjectDashboardTemplateProps) {
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
          <Card sx={{ ...cardStyle, marginTop: 2 }}>
            <CardContent>
              <EpiCurveChart
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
        {/* Third Row: Two cells sharing 50/50 */}
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <MetadataCounts
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                field="Date_coll"
                title="Metadata counts"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <OrgHasSeq
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
export default DefaultDashboard;
