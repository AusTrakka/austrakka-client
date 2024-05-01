import React from 'react';
import { Switch, TableCell, TableRow } from '@mui/material';
import { UserDetails } from '../../../types/dtos';
import { isoDateLocalDate } from '../../../utilities/helperUtils';

interface BasicRowProps {
  field: keyof UserDetails;
  value: any;
  readableNames: Record<string, string>;
}

function BasicRow(props: BasicRowProps) {
  const { field, value, readableNames } = props;
  return (
    <TableRow key={field}>
      <TableCell width="200em">{readableNames[field] || field}</TableCell>
      <TableCell>
        {(() => {
          switch (true) {
            case field === 'created':
              return isoDateLocalDate(value);
            case typeof value === 'boolean':
              return <Switch disabled checked={value} size="small" />;
            default:
              return value;
          }
        })()}
      </TableCell>
    </TableRow>
  );
}

export default BasicRow;
