/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { TableRow, TableCell, IconButton, Typography, Autocomplete, TextField, Stack } from '@mui/material';
import { KeyboardArrowDown, AddCircle, KeyboardArrowRight } from '@mui/icons-material';
import { Group, GroupRole, Role, User } from '../../../types/dtos';
import { RoleName, orgRoles, projectRoles } from '../../../permissions/roles';
import { sortGroups } from '../groupSortingV2';

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
