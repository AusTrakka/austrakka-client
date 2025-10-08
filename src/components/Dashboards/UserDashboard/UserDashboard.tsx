/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import UserOverview from '../../Widgets/UserWidgets/UserOverview/UserOverview';
import ProjectsTotal from '../../Widgets/UserWidgets/ProjectsTotal/ProjectsTotal';
import { cardStyle } from '../../../styles/dashboardStyles';

interface UserDashboardProps {
}

function UserDashboard(props: UserDashboardProps) {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid container size={12} justifyContent="space-between">
          <Typography variant="h2" color="primary">Dashboard</Typography>
        </Grid>
        <Grid
          container
          size={12}
          spacing={2}
          sx={{ marginTop: 1,
            padding: 2,
            backgroundColor: 'var(--primary-main-bg)' }}
        >
          <Card sx={cardStyle}>
            <CardContent>
              <UserOverview />
            </CardContent>
          </Card>
          <Card sx={cardStyle}>
            <CardContent>
              <ProjectsTotal />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
export default UserDashboard;
