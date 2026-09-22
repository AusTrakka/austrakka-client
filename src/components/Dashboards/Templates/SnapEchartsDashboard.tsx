import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import { WidgetType } from '../../../types/widget.props';
import EpiCurveEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/EpiCurveEchart';
import MetadataCountsEcharts from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataCountsEcharts';
import MetadataValuePieEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataValuePieEchart';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

function SnapDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid container sx={{ alignItems: 'flex-start' }} spacing={2} size={{ md: 12 }}>
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
                  widgetType={WidgetType.Project}
                  identifier={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  dateFilterField={dateFilterField}
                  preferredColourField="Country"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ lg: 7, md: 7, sm: 12 }}>
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataCountsEcharts
                  widgetType={WidgetType.Project}
                  identifier={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="Date_coll"
                  title="Metadata counts"
                  categoryField="Country"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{ lg: 5, md: 5, sm: 12 }}>
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  widgetType={WidgetType.Project}
                  identifier={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="SNAP_trial_group"
                  title="SNAP trial group counts"
                  colorScheme="set1"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{ lg: 6, md: 6, sm: 12 }}>
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  widgetType={WidgetType.Project}
                  identifier={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="mecA_status"
                  title="mecA status"
                  colorScheme="set1"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{ lg: 6, md: 6, sm: 12 }}>
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  widgetType={WidgetType.Project}
                  identifier={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="blaZ_status"
                  title="blaZ_status"
                  colorScheme="set1"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{ lg: 6, md: 6, sm: 12 }}>
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  widgetType={WidgetType.Project}
                  identifier={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="blaR_status"
                  title="blaR status"
                  colorScheme="set1"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid container size={{ lg: 6, md: 6, sm: 12 }}>
            <Card sx={tallCardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  widgetType={WidgetType.Project}
                  identifier={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="blaI_status"
                  title="blaI status"
                  colorScheme="set1"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>{' '}
        {/* big left column */}
      </Grid>
    </Box>
  );
}
export default SnapDashboard;
