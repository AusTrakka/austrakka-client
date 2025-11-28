import { IconButton, Tooltip } from '@mui/material';
import { SimCardDownload } from '@mui/icons-material';
import React from 'react';

interface ExportToolTipProps {
  disabled: boolean,
  exportData: () => void
}

function ExportToolTip({ exportData, disabled }: ExportToolTipProps) {
  return (
    <>
      <Tooltip title="Export to CSV" placement="top" arrow>
        <span>
          <IconButton
            onClick={() => { exportData(); }}
            disabled={disabled}
            color={disabled ? 'secondary' : 'default'}
          >
            <SimCardDownload />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}

export default ExportToolTip;
