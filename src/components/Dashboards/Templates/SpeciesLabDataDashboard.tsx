import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import Counts from '../../Widgets/ProjectWidgets/Counts';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import MetadataValueBarChart from '../../Widgets/ProjectWidgets/MetadataValueBarChart';
import MetadataValuePieChart from '../../Widgets/ProjectWidgets/MetadataValuePieChart';

function SpeciesLabDataDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid container sx={{ alignItems: 'flex-start' }} spacing={2} size={{ sm: 12 }}>
          <Grid container spacing={2} alignItems="stretch" size={{ sm: 12 }}>
            <Grid size={{ xl: 8, lg: 7, md: 12, sm: 12 }}>
              <Card sx={{ ...cardStyle, height: '100%' }}>
                <CardContent>
                  <EpiCurveChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    preferredColourField="Ref_lab"
                    dateFilterField={dateFilterField}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xl: 4, lg: 5, md: 12, sm: 12 }}>
              <Card sx={{ ...tallCardStyle, height: '100%' }}>
                <CardContent>
                  <Counts
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="State"
                    title="Counts by State"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={2} alignItems="stretch" size={{ sm: 12 }}>
            <Grid size={{ xl: 8, lg: 9, md: 12, sm: 12 }}>
              <Card sx={{ ...cardStyle }}>
                <CardContent>
                  <MetadataValueBarChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="AMR_reportable_submitted"
                    title="Top 10 AMR_reportable_submitted"
                    categoryLimit={10}
                    legendColumns={2}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xl: 4, lg: 3, md: 6, sm: 6 }}>
              <Card sx={{ ...cardStyle, height: '100%' }}>
                <CardContent>
                  <MetadataValuePieChart
                    field="MLST_submitted"
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
export default SpeciesLabDataDashboard;
