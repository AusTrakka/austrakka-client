/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { TableRow, TableCell, IconButton, Typography } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';

interface GroupHeaderRowProps {
  recordType: string;
  openGroupRoles: string[];
  handleGroupRoleToggle: (groupName: string) => void;
}

function GroupHeaderRowV2(props: GroupHeaderRowProps) {
  const {
    recordType,
    openGroupRoles,
    handleGroupRoleToggle,
  } = props;

  return (
    <TableRow key={recordType}>
      <TableCell colSpan={2}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => handleGroupRoleToggle(recordType)}
          >
            {openGroupRoles.includes(recordType) ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
          </IconButton>
          <Typography variant="body2">{recordType}</Typography>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default GroupHeaderRowV2;
