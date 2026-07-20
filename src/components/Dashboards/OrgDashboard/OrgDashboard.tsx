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
import SimpleMetadataBarChart from '../../Widgets/OrganisationWidgets/SimpleMetadataBarChart';
import HasSeq from '../../Widgets/ProjectWidgets/EChartsWidgets/HasSeqEchart';
import ChartInfoTooltip from '../../Widgets/ProjectWidgets/EChartsWidgets/InfoToolTip';
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

        if (uploadDates && data.metadata.length > 0) {
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
          {/* TOP ROW: Summary counts, recent activity and project contributions */}
          <Grid
            size={12}
            container
            spacing={2}
            sx={{ height: '100%', display: 'flex', minHeight: 0, overflow: 'hidden' }}
          >
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 3 }}>
              <Card sx={{ ...cardStyle, height: '100%' }}>
                <CardContent
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Grid size={12} container sx={{ height: '100%', display: 'flex' }}>
                    <Grid
                      size={12}
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
                          <Typography variant="subtitle2" paddingBottom={3} color="primary">
                            {latestUploadDate[1]}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h2" paddingBottom={3} color="primary">
                          N/A
                        </Typography>
                      )}
                      <Grid size={12} sx={{ minHeight: 0 }}>
                        <SimpleMetadataBarChart
                          widgetType={WidgetType.Organisation}
                          identifier={orgAbbrev}
                          filteredData={data?.metadata ?? []}
                          field="Shared_groups"
                          title="Sharing status"
                          colorMapping={{
                            Shared: Theme.SecondaryMain,
                            'Not shared': Theme.SecondaryYellow,
                          }}
                        />
                        <br />
                        <SimpleMetadataBarChart
                          widgetType={WidgetType.Organisation}
                          identifier={orgAbbrev}
                          filteredData={data?.metadata ?? []}
                          field="Has_sequences"
                          title="Sequence status"
                          colorMapping={{
                            Available: Theme.SecondaryMain,
                            Missing: Theme.SecondaryYellow,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 4 }}>
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
            <Grid size={{ xs: 12, xl: 5 }} sx={{ minHeight: '400px' }}>
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
          </Grid>
          {/* MIDDLE ROW: Species summary pie chart and table */}
          <Grid
            size={12}
            container
            spacing={2}
            sx={{ height: '100%', display: 'flex', minHeight: 0, overflow: 'hidden' }}
          >
            <Grid size={{ xs: 12 }} container direction="column">
              <Card
                sx={{
                  ...tallCardStyle,
                  height: { xs: 'auto', md: '100%' },
                  maxHeight: { xs: 'none', md: 450 },
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
                    overflow: { xs: 'visible', md: 'hidden' },
                    pb: 2,
                  }}
                >
                  <Grid container spacing={1} sx={{ width: '100%', flex: 1, minHeight: 0 }}>
                    <Grid
                      size={{ xs: 12, sm: 12, md: 4 }}
                      sx={{
                        height: { xs: 'auto', md: '100%' },
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                      }}
                    >
                      <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-start' }}>
                        <Typography
                          variant="h5"
                          paddingBottom={2}
                          color="primary"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            paddingRight: 1,
                          }}
                        >
                          Species summary
                        </Typography>
                        <ChartInfoTooltip text="Click legend items to show/hide · Hover for details" />
                      </Box>
                      <Box sx={{ flex: 1, minHeight: 0 }}>
                        <MetadataValuePieChart
                          widgetType={WidgetType.Organisation}
                          identifier={orgAbbrev}
                          field="Species_in_silico"
                          title=""
                          filteredData={data?.metadata ?? []}
                        />
                      </Box>
                    </Grid>
                    <Grid
                      size={{ xs: 12, sm: 12, md: 8 }}
                      sx={{
                        height: { xs: 'auto', md: '100%' },
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: { xs: 'auto', md: 'hidden' },
                      }}
                    >
                      <MetadataCountsByProject
                        widgetType={WidgetType.Organisation}
                        identifier={orgAbbrev}
                        title=""
                        categoryField="Species_in_silico"
                        filteredData={data?.metadata ?? []}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          {/* BOTTOM ROW: Metadata counts and has sequence counts */}
          <Grid container spacing={2} size={12}>
            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
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
