import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import {
  fetchOrgMetadata,
  type OrgMetadataState,
  selectOrgMetadata,
} from '../../../app/orgMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import LoadingState from '../../../constants/loadingState';
import { hasCompleteData } from '../../../constants/metadataLoadingState';
import RecordTypes from '../../../constants/record-type.enum';
import { cardStyle, tallCardStyle } from '../../../styles/dashboardStyles';
import { WidgetType } from '../../../types/widget.props';
import { maxObj } from '../../../utilities/dataProcessingUtils';
import { formatDateAsTwoStrings } from '../../../utilities/dateUtils';
import MetadataCountsByProject from '../../Widgets/OrganisationWidgets/MetadataCountsByProject';
import ProjectCounts from '../../Widgets/OrganisationWidgets/ProjectCounts';
import RecentActivityChart from '../../Widgets/OrganisationWidgets/RecentActivityChart';
import HasSeq from '../../Widgets/ProjectWidgets/EChartsWidgets/HasSeqEchart';
import MetadataCounts from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataCountsEcharts';
import MetadataValuePieChart from '../../Widgets/ProjectWidgets/EChartsWidgets/MetadataValuePieEchart';

const UPLOAD_DATE_FIELD = 'Date_created';

interface OrgDashboardProps {
  orgAbbrev: string;
}

function OrgDashboard(props: OrgDashboardProps) {
  const { orgAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();
  const data: OrgMetadataState | null = useAppSelector((state) =>
    selectOrgMetadata(state, orgAbbrev),
  );
  const [totalSampleCount, setTotalSampleCount] = useState<number | null>(null);
  const [latestUploadDate, setLatestUploadDate] = useState<string[] | null>(null);
  const loaded = hasCompleteData(data?.loadingState);

  useEffect(() => {
    if (
      orgAbbrev !== undefined &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      dispatch(fetchOrgMetadata({ token, orgAbbrev }));
    }
  }, [orgAbbrev, token, tokenLoading, dispatch]);

  useEffect(() => {
    if (!data?.fields) return;
    if (loaded) {
      // Process metadata to get counts and latest upload date for summary cards
      if (data.metadata) {
        // Set total count
        setTotalSampleCount(data.metadata.length ?? null);

        // Set latest upload date
        const uploadDates = data.fields.find((field) => field.columnName === UPLOAD_DATE_FIELD);
        if (uploadDates) {
          setLatestUploadDate(
            formatDateAsTwoStrings(
              maxObj(data.metadata.map((sample) => sample[UPLOAD_DATE_FIELD])),
            ),
          );
        } else {
          setLatestUploadDate(null);
        }
      }
    }
  }, [data?.metadata, data?.fields, loaded]);

  return (
    <Grid
      container
      size={12}
      spacing={2}
      sx={{
        marginTop: 1,
        padding: 2,
        backgroundColor: Theme.PrimaryMainBackground,
        flex: 1,
        minHeight: '100%',
      }}
    >
      {!hasCompleteData(data?.loadingState) ? (
        <Grid
          container
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          size={12}
          sx={{ height: '80vh' }}
        >
          <CircularProgress size={48} />
          Loading dashboard...
        </Grid>
      ) : (
        <>
          {/* Top two rows - together in one grid for flexible resizing */}
          <Grid
            size={12}
            container
            spacing={2}
            sx={{ height: '100%', display: 'flex', minHeight: 0, overflow: 'hidden' }}
          >
            <Grid size={8}>
              <Card sx={{ ...cardStyle, height: '100%', maxHeight: 400 }}>
                <CardContent
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  {/* Summary counts */}
                  <Grid size={12} container sx={{ height: '100%', display: 'flex' }}>
                    <Grid
                      size={4}
                      container
                      direction="column"
                      sx={{ minHeight: 0, height: '100%' }}
                    >
                      <Typography variant="h5" paddingBottom={1} color="primary">
                        Total samples
                      </Typography>
                      <Typography variant="h2" paddingBottom={3} color="primary">
                        {totalSampleCount ?? 'N/A'}
                      </Typography>
                      <Typography variant="h5" paddingBottom={1} color="primary">
                        Latest sample upload
                      </Typography>
                      {latestUploadDate ? (
                        <>
                          <Typography variant="h2" paddingBottom={1} color="primary">
                            {latestUploadDate[0]}
                          </Typography>
                          <Typography variant="subtitle2" paddingBottom={1} color="primary">
                            {latestUploadDate[1]}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h2" paddingBottom={1} color="primary">
                          N/A
                        </Typography>
                      )}
                    </Grid>
                    {/* Pie charts */}
                    <Grid size={8} container spacing={1} sx={{ minHeight: 0 }}>
                      <Grid size={6} sx={{ minHeight: 0 }}>
                        Sequence status chart
                      </Grid>
                      <Grid size={6} sx={{ minHeight: 0 }}>
                        Shared status chart
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card
                sx={{
                  ...cardStyle,
                  height: '100%',
                  maxHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent
                  sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                >
                  <ProjectCounts
                    widgetType={WidgetType.Organisation}
                    recordType={RecordTypes.ORGANISATION}
                    identifier={orgAbbrev}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={5}>
              <Card sx={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent
                  sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                >
                  <RecentActivityChart
                    widgetType={WidgetType.Organisation}
                    recordType={RecordTypes.ORGANISATION}
                    identifier={orgAbbrev}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={7} container direction="column">
              <Card
                sx={{
                  ...tallCardStyle,
                  height: '100%',
                  maxHeight: 450,
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
                    overflow: 'hidden',
                    pb: 2,
                  }}
                >
                  <Box sx={{ flex: '0 0 auto' }}>
                    <Typography
                      variant="h5"
                      paddingBottom={2}
                      color="primary"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                    >
                      Species distribution
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Grid container spacing={1} sx={{ width: '100%' }}>
                      <Grid size={5} sx={{ height: '100%' }}>
                        <MetadataValuePieChart
                          widgetType={WidgetType.Organisation}
                          identifier={orgAbbrev}
                          field="Species"
                          title=""
                          filteredData={data?.metadata ?? []}
                        />
                      </Grid>
                      <Grid
                        size={7}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <MetadataCountsByProject
                          widgetType={WidgetType.Organisation}
                          identifier={orgAbbrev}
                          title=""
                          categoryField="Species"
                          filteredData={data?.metadata ?? []}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          {/* Bottom row */}
          <Grid container spacing={2} size={12}>
            <Grid size={6}>
              <Card sx={{ ...cardStyle, height: '100%' }}>
                <CardContent>
                  <MetadataCounts
                    widgetType={WidgetType.Organisation}
                    identifier={orgAbbrev}
                    field="Date_coll"
                    title="Metadata counts"
                    categoryField="Shared_groups"
                    filteredData={data?.metadata ?? []}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={6}>
              <Card sx={{ ...tallCardStyle, height: '100%' }}>
                <CardContent>
                  <HasSeq
                    widgetType={WidgetType.Organisation}
                    identifier={orgAbbrev}
                    categoryField="Shared_groups"
                    filteredData={data?.metadata ?? []}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Grid>
  );
}
export default OrgDashboard;
