import React, { useState } from 'react';
import { IconButton, Switch, TableCell, TableRow, Tooltip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { User } from '../../../types/dtos';
import { isoDateLocalDate, isoDateOrNotRecorded } from '../../../utilities/dateUtils';

interface BasicRowProps {
  field: keyof User;
  value: any;
  readableNames: Record<string, string>;
}

function BasicRow(props: BasicRowProps) {
  const { field, value, readableNames } = props;
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
  };

  return (
    <TableRow key={field}>
      <TableCell width="200em">{readableNames[field] || field}</TableCell>
      <TableCell>
        {(() => {
          switch (true) {
            case field === 'lastActive':
            case field === 'lastLogIn':
              return isoDateOrNotRecorded(value);

            case field === 'created':
              return isoDateLocalDate(value);

            case field === 'objectId':
              return (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>{value}</span>
                  <Tooltip
                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                    placement="top"
                  >
                    <IconButton size="small" onClick={() => handleCopy(value)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              );

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
