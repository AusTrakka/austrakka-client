import { TableChart, TextSnippet } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const uploadPages = [
  {
    title: 'Upload Metadata',
    link: '/metadata',
    icon: <TableChart color="primary" />,
    description: 'Submit metadata for samples',
    disabled: false,
  },
  {
    title: 'Upload Sequences',
    link: '/sequences',
    icon: <TextSnippet color="primary" />,
    description: 'Coming soon!',
    disabled: false,
  },
];

function Upload() {
  const location = useLocation();
  useEffect(() => {
  }, []);

  return (
    <Box>
      <Typography variant="h2" color="primary" paddingBottom={1}>Upload</Typography>
      <Grid container direction="row" justifyContent="flex-start" spacing={2} alignItems="stretch">
        {uploadPages.map((page) => (
          <Grid item>
            <Card sx={{ maxWidth: 300, height: '100%' }}>
              <CardActionArea
                sx={{ textDecoration: 'none', height: '100%' }}
                component={Link}
                to={location.pathname + page.link}
                disabled={page.disabled}
              >
                <CardContent>
                  {page.icon}
                  <Typography variant="h5" component="div" color="primary">
                    {page.title}
                  </Typography>
                  <Typography variant="body2" component="div">
                    {page.description}
                  </Typography>
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
