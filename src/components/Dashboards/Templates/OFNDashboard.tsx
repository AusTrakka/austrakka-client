import { Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import { CustomFilterOperators } from '../../DataFilters/fieldTypeOperators';
import Counts from '../../Widgets/ProjectWidgets/Counts';
import EpiCurveChart from '../../Widgets/ProjectWidgets/EpiCurveChart';
import MetadataValueBarChart from '../../Widgets/ProjectWidgets/MetadataValueBarChart';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import MetadataTable from '../../Widgets/ProjectWidgets/SummaryMetadataTable';

function OFNDashboard(props: ProjectDashboardTemplateProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField } = props;

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Card sx={{ ...cardStyle, height: '100%' }}>
            <CardContent>
              <SampleSummary
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
        <Card sx={{ ...cardStyle }}>
          <CardContent>
            <Grid container spacing={2} size={12}>
              <Grid size={{ sm: 12, lg: 7 }}>
                <EpiCurveChart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  dateFilterField={dateFilterField}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5, lg: 2 }}>
                <MetadataValueBarChart
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="Jurisdiction"
                  title=""
                  legendColumns={2}
                  colourScheme="jurisdiction"
                  vertical
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 7, lg: 3 }}>
                <Counts
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  field="Jurisdiction"
                  title=""
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Grid container spacing={2} alignItems="stretch" size={12}>
          <Grid size={{ xl: 6, lg: 6, md: 12, sm: 12 }}>
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
          <Grid size={{ xl: 6, lg: 6, md: 12, sm: 12 }}>
            <Card
              sx={{
                ...tallCardStyle,
                height: '100%',
                maxHeight: 500,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                <MetadataTable
                  projectAbbrev={projectAbbrev}
                  filteredData={filteredData}
                  timeFilterObject={timeFilterObject}
                  displayFields={[
                    'Seq_ID',
                    'Date_coll',
                    'Reference_group_information',
                    'Jurisdiction',
                    'cgMLST',
                    'MLST',
                    'Place_of_acquisition_category',
                  ]}
                  title="Representative sequences"
                  include={[
                    {
                      field: 'Reference_group_information',
                      value: CustomFilterOperators.NOT_NULL_OR_EMPTY,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 4 }}>
          <Card
            sx={{
              ...tallCardStyle,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <Typography variant="h5" color="primary">
                Top 5 cgMLST (overall)
              </Typography>
              <Grid container spacing={2} size={12}>
                <Grid size={{ sm: 12, md: 8 }}>
                  <Counts
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="cgMLST"
                    title=""
                    categoryLimit={5}
                  />
                </Grid>
                <Grid size={{ sm: 12, md: 4 }}>
                  <MetadataValueBarChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="cgMLST"
                    title=""
                    categoryLimit={5}
                    legendColumns={1}
                    vertical
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 4 }}>
          <Card
            sx={{
              ...tallCardStyle,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <Typography variant="h5" color="primary">
                Top 5 cgMLST (excluding MLST 11)
              </Typography>
              <Grid container spacing={2} size={12}>
                <Grid size={{ sm: 12, md: 8 }}>
                  <Counts
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="cgMLST"
                    title=""
                    categoryLimit={5}
                    exclude={[{ field: 'MLST', value: '11' }]}
                  />
                </Grid>
                <Grid size={{ sm: 12, md: 4 }}>
                  <MetadataValueBarChart
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                    field="cgMLST"
                    title=""
                    categoryLimit={5}
                    legendColumns={1}
                    exclude={[{ field: 'MLST', value: '11' }]}
                    vertical
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ sm: 12, md: 12, lg: 8, xl: 4 }}>
          <Card
            sx={{
              ...tallCardStyle,
              height: '100%',
              maxHeight: 600,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <Organisations
                projectAbbrev={projectAbbrev}
                filteredData={filteredData}
                timeFilterObject={timeFilterObject}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
export default OFNDashboard;
