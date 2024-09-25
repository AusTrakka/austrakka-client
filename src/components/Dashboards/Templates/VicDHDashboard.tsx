import { Card, CardContent, Grid } from '@mui/material';
import React from 'react';
import SampleSummary from '../../Widgets/SampleSummary/SampleSummary';
import Organisations from '../../Widgets/Organisations/Organisations';
// import QcStatus from '../../Widgets/QcStatus/QcStatus';
import PhessIdStatus from '../../Widgets/PhessIdStatus/PhessIdStatus';
import StCounts from '../../Widgets/StCounts/StCounts';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';

// TODO: Set a max card height and handle scroll voerflow
function VicDHDashboard(props: ProjectDashboardTemplateProps) {
  const {
    projectId,
    projectAbbrev,
    groupId,
    filteredData,
    timeFilterObject,
  } = props;

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xl={8} xs={12}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <SampleSummary
                    projectId={projectId}
                    projectAbbrev={projectAbbrev}
                    groupId={groupId}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <StCounts
                    projectId={projectId}
                    projectAbbrev={projectAbbrev}
                    groupId={groupId}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs>
          <Grid container direction="row" spacing={2}>
            <Grid item xl={12} xs={4}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <Organisations
                    projectId={projectId}
                    projectAbbrev={projectAbbrev}
                    groupId={groupId}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                  />
                </CardContent>
              </Card>
            </Grid>
            {/* <Grid item xl={12} xs={4}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <QcStatus
                    projectId={projectId}
                    groupId={groupId}
                    setFilterList={setFilterList}
                    setTabValue={setTabValue}
                  />
                </CardContent>
              </Card>
            </Grid> */}
            <Grid item xl={12} xs={4}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <PhessIdStatus
                    projectId={projectId}
                    projectAbbrev={projectAbbrev}
                    groupId={groupId}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} />
    </>
  );
}
export default VicDHDashboard;
