import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import MetadataValueBarChart from '../../Widgets/ProjectWidgets/MetadataValueBarChart';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

function OFNDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid container sx={{ alignItems: 'flex-start' }} spacing={2} size={{ sm: 12 }}>
          <Grid size={{ sm: 12 }}>
            <Card sx={{ ...cardStyle, height: '100%' }}>
              <CardContent sx={{ height: '100%' }}>
                <SampleSummary
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container spacing={2} alignItems="stretch" size={{ sm: 12 }}>
            <Grid container direction="column" spacing={2} size={{ xl: 8, lg: 7, md: 12, sm: 12 }}>
              <Grid size={{ sm: 12 }}>
                <Card sx={{ ...cardStyle, height: '100%' }}>
                  <CardContent>
                    <MetadataValueBarChart
                      projectAbbrev={projectAbbrev}
                      filteredData={filteredData}
                      timeFilterObject={timeFilterObject}
                      field="Jurisdiction"
                      title="Samples by jurisdiction"
                      legendColumns={8}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ sm: 12 }}>
                <Card sx={{ ...cardStyle, height: '100%' }}>
                  <CardContent>
                    <MetadataValueBarChart
                      projectAbbrev={projectAbbrev}
                      filteredData={filteredData}
                      timeFilterObject={timeFilterObject}
                      field="cgMLST"
                      title="Top 5 cgMLST"
                      categoryLimit={5}
                      legendColumns={5}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Grid size={{ xl: 4, lg: 5, md: 12, sm: 12 }}>
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
          </Grid>
          <Grid container spacing={2} alignItems="stretch" size={{ sm: 12 }}>
            <Grid size={{ xl: 6, lg: 12, md: 12, sm: 12 }}>
              <Card sx={{ ...cardStyle, height: '100%' }}>
                <CardContent>
                  <EpiCurveChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    dateFilterField={dateFilterField}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xl: 6, lg: 12, md: 12, sm: 12 }}>
              <Card sx={{ ...cardStyle, height: '100%' }}>
                <CardContent>
                  <EpiCurveChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    preferredColourField="Place_of_acquisition_category"
                    dateFilterField={dateFilterField}
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
export default OFNDashboard;
