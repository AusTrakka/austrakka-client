/* eslint-disable react/jsx-one-expression-per-line */
import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import MetadataCounts from '../../Widgets/ProjectWidgets/MetadataCounts';
import HasSeq from '../../Widgets/ProjectWidgets/HasSeq';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import Counts from '../../Widgets/ProjectWidgets/Counts';
import MetadataValuePieChart from '../../Widgets/ProjectWidgets/MetadataValuePieChart';

function SnapDashboard(props: ProjectDashboardTemplateProps) {
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
          size={{ lg: 8, md: 12 }}
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
                  categoryField="Country"
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
                  categoryField="Country"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid> {/* big left column */}
        <Grid container spacing={2} size={{ lg: 4, md: 12 }}> {/* narrow right column */}
          <Grid container size={{ lg: 12, md: 6, sm: 12 }}> {/* NB fraction of parent column, which is smaller at lg */}
            <Card sx={tallCardStyle}>
              <CardContent>
                <Counts
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="Referring_site"
                  title="Referring site counts"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{ lg: 12, md: 6, sm: 12 }}> {/* NB fraction of parent column */}
            <Card sx={tallCardStyle}>
              <CardContent>
                <Counts
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="SNAP_trial_group"
                  title="SNAP trial group counts"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{ lg: 12, md: 6, sm: 12 }}> {/* NB fraction of parent column */}
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieChart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="mecA_status"
                  title="mecA status"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid> {/* rightmost column */}
      </Grid>
    </Box>
  );
}
export default SnapDashboard;
