import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Info } from '@mui/icons-material';

export function InfoTooltip(title: string) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          style={{ padding: 0, marginLeft: '0.5rem' }}
        >
          <Info fontSize="small" style={{ color: 'var(--primary-grey-500)' }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
