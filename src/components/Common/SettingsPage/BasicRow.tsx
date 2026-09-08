import { Cancel, CheckCircleOutlined, ContentCopy } from '@mui/icons-material';
import { IconButton, Switch, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import type { User } from '../../../types/dtos';
import { isoDateLocalDate } from '../../../utilities/dateUtils';
import './RowAndCell.css';
import { Theme } from '../../../assets/themes/theme';
import { formatBytes } from '../../../utilities/renderUtils';
import { FieldLabelWithTooltip } from './FieldLabelWithToolTip';

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

  const immutableGuids = ['objectId', 'globalId'];

  return (
    <TableRow key={field} style={{ borderBottom: 'none' }}>
      <TableCell className="key-cell">
        <FieldLabelWithTooltip field={field} readableNames={readableNames} />
      </TableCell>
      <TableCell className="value-cell">
        {(() => {
          switch (true) {
            case field === 'created':
              return isoDateLocalDate(value);

            case immutableGuids.includes(field):
              return (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" style={{ marginRight: '8px' }}>
                    {value}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} placement="top">
                    <IconButton size="small" onClick={() => handleCopy(value)}>
                      <ContentCopy style={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </div>
              );
            case typeof value === 'boolean':
              return (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Switch disabled checked={value} size="small" />
                  <Tooltip title={value ? 'Active' : 'Disabled'} arrow placement="top">
                    {value ? (
                      <CheckCircleOutlined
                        fontSize="small"
                        style={{ color: Theme.SecondaryLightGreen }}
                      />
                    ) : (
                      <Cancel style={{ fontSize: '1rem' }} />
                    )}
                  </Tooltip>
                </div>
              );
            case typeof value === 'number':
              return (
                <Typography variant="body2">{`${formatBytes(value, true)} per month`}</Typography>
              );
            default:
              return value;
          }
        })()}
      </TableCell>
    </TableRow>
  );
}

export default BasicRow;
