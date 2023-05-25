import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const uploadPages = [
  {
    title: 'Upload Metadata',
    link: '/metadata',
    description: 'Submit metadata for samples',
    disabled: false,
  },
  {
    title: 'Upload Sequences',
    link: '/sequences',
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
      <Typography className="pageTitle">
        Upload
      </Typography>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
        direction="row"
        justifyContent="flex-start"
      >
        {uploadPages.map((page) => (
          <Grid item>
            <Card sx={{ minWidth: 275 }}>
              <CardActionArea
                sx={{ textDecoration: 'none' }}
                component={Link}
                to={location.pathname + page.link}
                disabled={page.disabled}
              >
                <CardContent>
                  <Typography variant="h6" component="div">
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
