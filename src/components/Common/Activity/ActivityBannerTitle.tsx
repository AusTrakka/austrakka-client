import React from 'react';
import { Typography } from '@mui/material';

interface PageTitleProps {
  title: string,
  fontWeight?: string,
}

function BannerTitle({ title, fontWeight }: PageTitleProps): any {
  const weight = fontWeight !== undefined ? fontWeight : 'normal';
  return (
    <Typography
      sx={{
        color: 'var(--primary-main)',
        fontSize: '2rem',
        marginBottom: 0,
        fontWeight: weight,
      }}
    >
      {title}
    </Typography>
  );
}

export default BannerTitle;
