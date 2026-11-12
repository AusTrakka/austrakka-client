import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Theme } from '../../../assets/themes/theme';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import { WidgetType } from '../../../types/widget.props';
import EpiCurveEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/EpiCurveEchart';
import HasSeqEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/HasSeqEchart';
import MetadataCountsEcharts from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataCountsEcharts';
import MetadataValuePieChartEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataValuePieEchart';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

function PublicHealthInternationalEchartsDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid container sx={{ alignItems: 'flex-start' }} size={{ lg: 8, md: 12 }} spacing={2}>
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
                preferredColourField={'Country'}
              />
            </CardContent>
          </Card>
          <Card sx={tallCardStyle}>
            <CardContent>
              <MetadataCountsEcharts
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                field="Date_coll"
                title="Metadata counts"
              />
            </CardContent>
          </Card>
          <Card sx={tallCardStyle}>
            <CardContent>
              <HasSeqEchart
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid
          container
          sx={{ alignItems: 'flex-start' }}
          size={{ lg: 4, md: 6, xs: 8 }}
          spacing={2}
        >
          <Card sx={tallCardStyle}>
            <CardContent>
              <Organisations
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
          <Card sx={tallCardStyle}>
            <CardContent>
              <MetadataValuePieChartEchart
                field="Species_in_silico"
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                categoryLimit={10}
                categoryLimitOptions={[5, 10, 15, 20, 25]}
              />
            </CardContent>
          </Card>
          <Card sx={tallCardStyle}>
            <CardContent>
              <MetadataValuePieChartEchart
                field="QC"
                colorMapping={{
                  FAIL: Theme.SecondaryRed,
                  FLAG: Theme.SecondaryOrange,
                  PASS: Theme.SecondaryLightGreen,
                  NA: Theme.SecondaryYellow,
                }}
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
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
export default PublicHealthInternationalEchartsDashboard;
