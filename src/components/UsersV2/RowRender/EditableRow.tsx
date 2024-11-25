/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction, useState } from 'react';
import {
  Autocomplete,
  IconButton,
  Switch,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  CancelOutlined,
  CheckCircleOutlined,
  ContentCopy,
} from '@mui/icons-material';
import { FieldLabelWithTooltip } from './FieldLabelWithToolTip';
import { User } from '../../../types/dtos';
import { isoDateLocalDate } from '../../../utilities/dateUtils';
import './RowAndCell.css';

interface EditableRowProps {
  field: keyof User;
  detailValue: any;
  editedValues: User | null;
  setEditedValues: Dispatch<SetStateAction<User | null>>;
  readableNames: Record<string, string>;
  allOrgs: any[];
  setOrgChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

function EditableRow(props : EditableRowProps) {
  const {
    field,
    detailValue,
    editedValues,
    setEditedValues,
    readableNames,
    allOrgs,
    setOrgChanged,
  } = props;
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
  };

  const nonEditableFields = [
    'created',
    'objectId',
    'globalId',
  ];
  
  const immutableGuids = [
    'objectId',
    'globalId',
  ];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.target;
    setEditedValues((prevValues) => {
      if (prevValues === null) return null;
      return {
        ...prevValues,
        [field]: value,
      };
    });
  };

  const handleChangeBoolean = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setEditedValues((prevValues) => {
      if (prevValues === null) return null;
      return {
        ...prevValues,
        [field]: checked,
      };
    });
  };
  
  switch (typeof detailValue) {
    case 'string':
      if (nonEditableFields.includes(field)) {
        return (
          <TableRow key={field}>
            <TableCell className="key-cell-editing">{readableNames[field] || field}</TableCell>
            <TableCell className="value-cell-editing">
              {(() => {
                switch (true) {
                  case field === 'created':
                    return isoDateLocalDate(detailValue);
                  case immutableGuids.includes(field):
                    return (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>{detailValue}</span>
                        <Tooltip
                          title={copied ? 'Copied!' : 'Copy to clipboard'}
                          placement="top"
                        >
                          <IconButton size="small" onClick={() => handleCopy(detailValue)}>
                            <ContentCopy style={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    );
                  default:
                    return detailValue;
                }
              })()}
            </TableCell>
          </TableRow>
        );
      }
      if (field === 'orgName') {
        return (
          <TableRow key={field}>
            <TableCell className="key-cell-editing">{readableNames[field] || field}</TableCell>
            <TableCell className="value-cell-editing">
              <Autocomplete
                options={allOrgs.map((org) => org.name)}
                disableClearable
                getOptionLabel={(option) => option.name ?? option}
                value={editedValues?.orgName || null}
                onChange={(event, newValue) => {
                  setOrgChanged(true);
                  setEditedValues((prevValues) => {
                    if (prevValues === null) return null;
                    return {
                      ...prevValues,
                      [field]: newValue,
                      'orgAbbrev': allOrgs.find((org) => org.name === newValue)?.abbreviation || prevValues.orgAbbrev,
                    };
                  });
                }}
                renderOption={(_props, option) => (
                  <li {..._props} style={{ fontSize: '0.8em' }}>
                    {option}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    hiddenLabel
                    variant="filled"
                    InputProps={{
                      ...params.InputProps,
                      inputProps: {
                        ...params.inputProps,
                        style: {
                          fontSize: '0.9em',
                        },
                      },
                    }}
                    style={{ padding: '0px' }}
                  />
                )}
              />
            </TableCell>
          </TableRow>
        );
      }
      return (
        <TableRow key={field}>
          <TableCell className="key-cell-editing">
            <FieldLabelWithTooltip field={field} readableNames={readableNames} />
          </TableCell>
          <TableCell className="value-cell-editing">
            <TextField
              style={{ padding: '0px' }}
              value={editedValues?.[field] || ''}
              onChange={handleChange}
              variant="filled"
              fullWidth
              size="small"
              hiddenLabel
              inputProps={{ style: { fontSize: '.9em' } }}
            />
          </TableCell>
        </TableRow>
      );
    case 'boolean':
      return (
        <TableRow key={field}>
          <TableCell className="key-cell-editing">{readableNames[field] || field}</TableCell>
          <TableCell className="value-cell-editing">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Switch checked={editedValues?.[field] as boolean || false} size="small" onChange={handleChangeBoolean} />
              <Tooltip title={(editedValues?.[field] as boolean) ? 'Active' : 'Disabled'} arrow placement="top">
                {(editedValues?.[field] as boolean || false) ? (
                  <CheckCircleOutlined
                    fontSize="small"
                    style={{ color: 'var(--secondary-light-green)' }}
                  />
                )
                  :
                  <CancelOutlined fontSize="small" style={{ color: 'var(--secondary-orange)' }} />}
              </Tooltip>
            </div>
          </TableCell>
        </TableRow>
      );
    case 'object':
      if (detailValue === null) {
        return (
          <TableRow key={field}>
            <TableCell className="key-cell-editing">
              <FieldLabelWithTooltip field={field} readableNames={readableNames} />
            </TableCell>
            <TableCell className="value-cell-editing">
              <TextField
                value={editedValues?.[field] as string || ''}
                onChange={handleChange}
                variant="filled"
                fullWidth
                inputProps={{ style: { padding: '9px 10px', fontSize: '.9rem' } }}
                size="small"
              />
            </TableCell>
          </TableRow>
        );
      }
      break;
    default:
      return (
        <TableRow key={field}>
          <TableCell className="key-cell-editing" style={{ borderBottom: 'none' }}>
            <FieldLabelWithTooltip field={field} readableNames={readableNames} />
          </TableCell>
          <TableCell className="value-cell-editing">{detailValue}</TableCell>
        </TableRow>
      );
  }
  return null;
}

export default EditableRow;
