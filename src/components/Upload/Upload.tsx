import { TableChart, TextSnippet } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const uploadPages = [
  {
    title: 'Upload Metadata',
    link: '/metadata',
    icon: <TableChart color="primary" />,
    description: 'Submit metadata for samples.',
    disabled: false,
  },
  {
    title: 'Upload Sequences',
    link: '/sequences',
    icon: <TextSnippet color="primary" />,
    description: 'Coming soon!',
    disabled: true,
  },
];

function Upload() {
  const location = useLocation();
  useEffect(() => {
  }, []);

  return (
    <Box>
      <Typography variant="h2" color="primary" paddingBottom={2}>Upload</Typography>
      <Grid container direction="row" justifyContent="flex-start" spacing={2} alignItems="stretch">
        {uploadPages.map((page) => (
          <Grid item key={page.title}>
            <Card sx={{ width: 200, height: 150 }}>
              <CardActionArea
                sx={{ height: '100%', borderBottom: 4, borderColor: 'secondary.main' }}
                component={Link}
                to={location.pathname + page.link}
                disabled={page.disabled}
              >
                <CardContent>
                  <Grid container direction="column">
                    <Grid item>
                      {page.icon}
                    </Grid>
                    <Grid item>
                      <Typography variant="h5" component="div" color="primary" sx={{ paddingTop: 1 }}>
                        {page.title}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" component="div">
                        {page.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
export default Upload;
