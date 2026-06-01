import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import EpiCurveEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/EpiCurveEchart';
import HasSeqEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/HasSeqEchart';
import MetadataCountsEcharts from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataCountsEcharts';
import MetadataValuePieEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataValuePieEchart';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

// This dashboard is intended to be used for demo projects,
// and to be updated without impacting real investigations
function DemoEchartsDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid
          container
          sx={{ alignItems: 'flex-start' }}
          spacing={2}
          size={{ xl: 9, lg: 9, md: 12 }}
        >
          {' '}
          {/* big left column */}
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
                <EpiCurveEchart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  dateFilterField={dateFilterField}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ lg: 6, md: 12 }}>
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataCountsEcharts
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
                <HasSeqEchart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>{' '}
        {/* big left column */}
        <Grid
          container
          sx={{ alignItems: 'flex-start' }}
          spacing={2}
          size={{ xl: 3, lg: 3, md: 12 }}
        >
          {' '}
          {/* narrow right column */}
          <Grid size={{ lg: 12, md: 6, sm: 12 }}>
            {' '}
            {/* NB at lg, 100% of narrower column */}
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="State"
                  title="Regional jurisdiction"
                  colorScheme="jurisdiction" /* Works for Jurisdiction or AU State values */
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ lg: 12, md: 6, sm: 12 }}>
            {' '}
            {/* NB at lg, 100% of narrower column */}
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="Serotype"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>{' '}
        {/* narrow right column */}
      </Grid>
    </Box>
  );
}
export default DemoEchartsDashboard;
