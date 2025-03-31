import { Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React from 'react';
import SampleSummary from '../../Widgets/ProjectWidgets/SampleSummary';
import Organisations from '../../Widgets/ProjectWidgets/Organisations';
import PhessIdStatus from '../../Widgets/ProjectWidgets/PhessIdStatus';
import StCounts from '../../Widgets/ProjectWidgets/StCounts';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';

function VicDHDashboard(props: ProjectDashboardTemplateProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
  } = props;
  
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xl: 8, md: 12 }}>
          <Grid container direction="column" spacing={2}>
            <Grid>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <SampleSummary
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <StCounts
                    projectAbbrev={projectAbbrev}
                    filteredData={filteredData}
                    timeFilterObject={timeFilterObject}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid >
          <Grid container direction="row" spacing={2}>
            <Grid size={{ xl: 12, xs: 4}}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <Organisations
                    projectAbbrev={projectAbbrev}
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
            <Grid size={{ xl: 12, xs: 4 }}>
              <Card sx={{ padding: 1, border: 'none', boxShadow: 'none' }}>
                <CardContent>
                  <PhessIdStatus
                    projectAbbrev={projectAbbrev}
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
