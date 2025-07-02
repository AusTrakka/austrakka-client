import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import MetadataCounts from '../../Widgets/ProjectWidgets/MetadataCounts';
import MetadataValuePieChart from '../../Widgets/ProjectWidgets/MetadataValuePieChart';
import HasSeq from '../../Widgets/ProjectWidgets/HasSeq';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';

function WithQC(props: ProjectDashboardTemplateProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid container sx={{ alignItems: 'flex-start' }} size={{ lg: 8, md: 12 }}>
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
          <Grid size={12}>
            <Card sx={cardStyle}>
              <CardContent>
                <EpiCurveChart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container sx={{ alignItems: 'flex-start' }} size={{ lg: 4, md: 12 }}>
          <Grid size={{ lg: 12, md: 6, sm: 12 }}>
            <Card sx={cardStyle}>
              <CardContent>
                <MetadataValuePieChart
                  field="QC"
                  colourMapping={{
                    'FAIL': '#bf1515',
                    'FLAG': '#fac45a',
                    'PASS': '#78c95d',
                  }}
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ lg: 12, md: 6, sm: 12 }}>
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
              <HasSeq
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
export default WithQC;
