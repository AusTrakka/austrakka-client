import React from 'react';
import { Person, PersonOff, AdminPanelSettings, PrecisionManufacturing } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

function renderIcon(rowData: any, size: any = 'small') {
  const { isActive, isAusTrakkaAdmin, isAusTrakkaProcess } = rowData;
  console.log(rowData);

  if (!isAusTrakkaAdmin && !isAusTrakkaProcess) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {
        (isActive)
          ? (
            <Tooltip title="User" placement="top" arrow>
              <Person color="primary" fontSize={size} style={{ margin: '0.5rem' }} />
            </Tooltip>
          ) : (
            <Tooltip title="Disabled-User" placement="top" arrow>
              <PersonOff color="error" fontSize={size} style={{ margin: '0.5rem' }} />
            </Tooltip>
          )
    }
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {isAusTrakkaAdmin && (
        <Tooltip title="AusTrakka-Admin" placement="top" arrow>
          <AdminPanelSettings color="secondary" fontSize={size} style={{ margin: '0.5rem' }} />
        </Tooltip>
      )}
      {isAusTrakkaProcess && (
        <Tooltip title="AusTrakkaProcess" placement="top" arrow>
          <PrecisionManufacturing color="info" fontSize={size} style={{ margin: '0.5rem' }} />
        </Tooltip>
      )}
    </div>
  );
}

export default renderIcon;
