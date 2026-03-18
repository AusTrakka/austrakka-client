import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Theme } from '../../../assets/themes/theme';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import Counts from '../../Widgets/ProjectWidgets/Counts';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import MetadataValueBarChart from '../../Widgets/ProjectWidgets/MetadataValueBarChart';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

function LabDataDashboard(props: ProjectDashboardTemplateProps) {
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
                      field="Species_in_silico"
                      title="Top 10 Species_in_silico"
                      categoryLimit={10}
                      legendColumns={3}
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
                      field="AMR_mechanisms_submitted"
                      title="Top 10 AMR_mechanisms_submitted"
                      categoryLimit={10}
                      legendColumns={3}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Grid size={{ xl: 4, lg: 5, md: 12, sm: 12 }}>
              <Card sx={{ ...tallCardStyle, height: '100%' }}>
                <CardContent>
                  <Counts
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="Ref_lab"
                    title="Referring laboratories"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={2} alignItems="stretch" size={{ sm: 12 }}>
            <Grid size={{ md: 8, sm: 12 }}>
              <Card sx={{ ...cardStyle, height: '100%' }}>
                <CardContent>
                  <EpiCurveChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    preferredColourField="QC"
                    dateFilterField={dateFilterField}
                    colourMapping={{
                      FAIL: Theme.SecondaryRed,
                      FLAG: Theme.SecondaryYellow,
                      PASS: Theme.SecondaryMain,
                      NA: Theme.SecondaryDarkGrey,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ md: 4, sm: 12 }}>
              <Card sx={{ ...cardStyle }}>
                <CardContent>
                  <MetadataValueBarChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="QC"
                    title="QC status"
                    colourMapping={{
                      FAIL: Theme.SecondaryRed,
                      FLAG: Theme.SecondaryYellow,
                      PASS: Theme.SecondaryMain,
                      NA: Theme.SecondaryDarkGrey,
                    }}
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
export default LabDataDashboard;
