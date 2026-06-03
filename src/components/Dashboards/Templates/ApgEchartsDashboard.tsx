import { Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { memo } from 'react';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import { WidgetType } from '../../../types/genericwidget.props';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import EpiCurveEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/EpiCurveEchart';
import HasSeqEchart from '../../Widgets/ProjectWidgets/EChartsWidgets/HasSeqEchart';
import MetadataCountsEcharts from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataCountsEcharts';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';

function ApgDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <Box>
      <Grid container spacing={2}>
        {/* First Row: Single Grid spanning the entire row */}
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

        {/* Second Row: Two Grids sharing 70% and 25% */}
        <Grid size={{ xs: 12, md: 12, lg: 9 }}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <EpiCurveEchart
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                dateFilterField={dateFilterField}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 3 }}>
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
        {/* Third Row: Two cells sharing 50/50 */}
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
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
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
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
        {/* Fourth Row: Two cells */}
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <MetadataCountsEcharts
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                field="Reads_accession"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
          <Card sx={tallCardStyle}>
            <CardContent>
              <MetadataCountsEcharts
                widgetType={WidgetType.Project}
                identifier={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
                field="Assembly_accession"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default memo(ApgDashboard);
