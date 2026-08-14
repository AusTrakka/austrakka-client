import { Stack, Typography } from '@mui/material';
import type React from 'react';

export interface PivotCellProps {
  value?: React.ReactNode;
  percentage?: number | string | null;
  showPercentage?: boolean;
}

export function PivotCell({ value, percentage, showPercentage = false }: PivotCellProps) {
  // Handle empty or missing values
  if (value === null || value === undefined || value === '' || value === '—') {
    return <>—</>;
  }

  const hasValidPct = percentage !== null && percentage !== undefined && percentage !== '';
  const shouldShowPct = showPercentage && hasValidPct;

  if (!shouldShowPct) {
    return <>{value}</>;
  }

  const strPct = String(percentage);
  const formattedPct = strPct.endsWith('%') ? strPct : `${strPct}%`;

  return (
    <Stack direction="row" spacing={0.75} alignItems="baseline" display="inline-flex">
      <span>{value}</span>
      <Typography
        component="span"
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 400 }}
      >
        ({formattedPct})
      </Typography>
    </Stack>
  );
}
