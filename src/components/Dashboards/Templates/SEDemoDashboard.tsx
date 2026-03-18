import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

// This dashboard is intended to be used for demo projects,
// and to be updated without impacting real investigations
function DemoDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid
          container
          sx={{ alignItems: 'flex-start' }}
          spacing={2}
          size={{ xl: 12, lg: 12, md: 12 }}
        >
          <Grid size={{ xl: 7, lg: 9, md: 12, sm: 12 }}>
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
                  dateFilterField={dateFilterField}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
export default DemoDashboard;
