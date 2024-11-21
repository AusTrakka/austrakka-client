import React, { useState } from 'react';
import { Icon, IconButton, Switch, TableCell, TableRow, Tooltip } from '@mui/material';
import { ContentCopy, Info } from '@mui/icons-material';
import { User } from '../../../types/dtos';
import { isoDateLocalDate } from '../../../utilities/dateUtils';
import './RowAndCell.css';

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

  const immutableGuids = [
    'objectId',
    'globalId',
  ];

  return (
    <TableRow key={field} style={{ borderBottom: 'none' }}>
      <TableCell className="key-cell">
        {field === 'analysisServerUsername' ? (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {readableNames[field] || field}
            <Tooltip title="Analysis Server Username">
              <IconButton
                size="small"
                style={{ padding: 0, marginLeft: '0.5rem' }}
              >
                <Info fontSize="small" style={{ color: 'var(--primary-grey-500)' }} />
              </IconButton>
            </Tooltip>
          </span>
        ) : (
          readableNames[field] || field
        )}
      </TableCell>
      <TableCell className="value-cell">
        {(() => {
          switch (true) {
            case field === 'created':
              return isoDateLocalDate(value);
           
            case immutableGuids.includes(field):
              return (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>{value}</span>
                  <Tooltip
                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                    placement="top"
                  >
                    <IconButton size="small" onClick={() => handleCopy(value)}>
                      <ContentCopy style={{ fontSize: '1rem' }} />
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
