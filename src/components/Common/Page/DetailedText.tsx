import React from 'react';
import { Typography } from '@mui/material';

interface DetailedTextProps {
  text: string,
  isSubHeading?: boolean,
  display?: string,
}

function DetailedText({ text, isSubHeading, display }: DetailedTextProps): any {
  const semiBold = '600';
  const fontWeight = isSubHeading ? semiBold : 'normal';
  const displayStyle = display || 'block';
  const whiteSpaceStyle = display === 'inline-block' ? 'pre-wrap' : 'normal';
    
  return (
    <Typography
      className="detailed-text"
      sx={{
        fontSize: '14px',
        marginTop: 0,
        fontWeight,
        color: 'rgb(50,49,48)',
        display: displayStyle,
        whiteSpace: whiteSpaceStyle,
      }}
    >
      {text}
    </Typography>
  );
}

export default DetailedText;
