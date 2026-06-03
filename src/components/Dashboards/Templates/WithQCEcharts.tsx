import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Theme } from '../../../assets/themes/theme';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import { WidgetType } from '../../../types/genericwidget.props';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import EpiCurveEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/EpiCurveEchart';
import HasSeqEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/HasSeqEchart';
import MetadataCountsEcharts from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataCountsEcharts';
import MetadataValuePieEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataValuePieEchart';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

function WithQC(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container sx={{ alignItems: 'flex-start' }} spacing={2}>
        <Grid container sx={{ alignItems: 'flex-start' }} size={{ lg: 8, md: 12 }}>
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
            <Card sx={{ ...cardStyle }}>
              <CardContent>
                <EpiCurveEchart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  dateFilterField={dateFilterField}
                  tall={true}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container sx={{ alignItems: 'flex-start' }} size={{ lg: 4, md: 12 }}>
          <Grid size={{ lg: 12, md: 6, sm: 12 }}>
            <Card sx={cardStyle}>
              <CardContent>
                <MetadataValuePieEchart
                  field="QC"
                  colorMapping={{
                    FAIL: Theme.SecondaryRed,
                    FLAG: Theme.SecondaryOrange,
                    PASS: Theme.SecondaryMain,
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
          <Grid size={{ lg: 12, md: 6, sm: 12 }}>
            <Card sx={{ ...tallCardStyle, maxHeight: 350 }}>
              <CardContent>
                <Organisations
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  clamped={true}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {/* Third Row: Two cells sharing 50/50 */}
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
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
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
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
      </Grid>
    </Box>
  );
}
export default WithQC;
