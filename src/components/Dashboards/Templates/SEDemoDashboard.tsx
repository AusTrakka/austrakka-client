/* eslint-disable react/jsx-one-expression-per-line */
import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import MetadataCounts from '../../Widgets/ProjectWidgets/MetadataCounts';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import MetadataValuePieChart from '../../Widgets/ProjectWidgets/MetadataValuePieChart';
import HasSeq from '../../Widgets/ProjectWidgets/HasSeq';

// This dashboard is intended to be used for demo projects,
// and to be updated without impacting real investigations
function DemoDashboard(props: ProjectDashboardTemplateProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid
          container
          sx={{ alignItems: 'flex-start' }}
          spacing={2}
          size={{ xl: 9, lg: 9, md: 12 }}
        > {/* big left column */}
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
          <Grid size={{ lg: 6, md: 12 }}>
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
          <Grid size={{ lg: 6, md: 12 }}>
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
        </Grid> {/* big left column */}
        <Grid
          container
          sx={{ alignItems: 'flex-start' }}
          spacing={2}
          size={{ xl: 3, lg: 3, md: 12 }}
        > {/* narrow right column */}
          <Grid size={{ lg: 12, md: 6, sm: 12 }}> {/* NB at lg, 100% of narrower column */}
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieChart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="State"
                  title="Regional jurisdiction"
                  colourScheme="jurisdiction" /* Works for Jurisdiction or AU State values */
                  legendColumns={3}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ lg: 12, md: 6, sm: 12 }}> {/* NB at lg, 100% of narrower column */}
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieChart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="MLST"
                  legendColumns={3}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid> {/* narrow right column */}
      </Grid>
    </Box>
  );
}
export default DemoDashboard;
