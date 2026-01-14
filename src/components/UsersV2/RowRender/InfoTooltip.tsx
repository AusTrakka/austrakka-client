import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Info } from '@mui/icons-material';
import { Theme } from '../../../assets/themes/theme';

export function InfoTooltip(title: string) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          style={{ padding: 0, marginLeft: '0.5rem' }}
        >
          <Info fontSize="small" style={{ color: Theme.PrimaryGrey500 }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
