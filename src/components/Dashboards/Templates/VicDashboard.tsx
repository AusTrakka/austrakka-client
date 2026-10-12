import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import { WidgetType } from '../../../types/widget.props';
import EpiCurveEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/EpiCurveEchart';
import MetadataValuePieChart from '../../Widgets/ProjectWidgets/MetadataValuePieChart';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

function VicDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid container sx={{ alignItems: 'flex-start' }} spacing={2} size={8}>
          <Card sx={cardStyle}>
            <CardContent>
              <SampleSummary
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
          <Card sx={cardStyle}>
            <CardContent>
              <EpiCurveEchart
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                dateFilterField={dateFilterField}
                preferredColourField="Genus_group"
              />
            </CardContent>
          </Card>
          <Card sx={cardStyle}>
            <CardContent>
              <EpiCurveEchart
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                dateFilterField={dateFilterField}
                preferredColourField="Gene_group"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid container sx={{ alignItems: 'flex-start' }} spacing={2} size={4}>
          <Card sx={cardStyle}>
            <CardContent>
              <MetadataValuePieChart
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                field="Gene_group"
                legendColumns={3}
              />
            </CardContent>
          </Card>
          <Card sx={cardStyle}>
            <CardContent>
              <MetadataValuePieChart
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                field="Suspected_acquisition_source"
                legendColumns={3}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
export default VicDashboard;
