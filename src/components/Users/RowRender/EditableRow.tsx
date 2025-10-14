/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction } from 'react';
import { Autocomplete, InputAdornment, Switch, TableCell, TableRow, TextField, Typography } from '@mui/material';
import { User } from '../../../types/dtos';
import { isoDateLocalDate, isoDateOrNotRecorded } from '../../../utilities/dateUtils';
import { FieldLabelWithTooltip } from '../../UsersV2/RowRender/FieldLabelWithToolTip';
import { bytesToMB } from '../../../utilities/renderUtils';

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
  
  const nonEditableFields = [
    'created',
    'objectId',
    'globalId',
    'lastLogIn',
    'lastActive',
    'monthlyBytesUsed',
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
  
  const handleMBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mbValue = parseFloat(e.target.value) || 0;
    const bytes = Math.round(mbValue * 1024 * 1024);

    setEditedValues(prevValues => {
      if (!prevValues) return null;
      return { ...prevValues, [field]: bytes };
    });
  };
  
  switch (typeof detailValue) {
    case 'string':
     
      if (nonEditableFields.includes(field)) {
        let displayValue;
        if (field === 'created') {
          displayValue = isoDateLocalDate(detailValue);
        } else if (field === 'lastLogIn' || field === 'lastActive') {
          displayValue = isoDateOrNotRecorded(detailValue); // Replace with your method
        } else {
          displayValue = detailValue;
        }

        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>{displayValue}</TableCell>
          </TableRow>
        );
      }

      if (field === 'orgName') {
        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>
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
                  <li {..._props} style={{ fontSize: '0.9em' }}>
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
                  />
                )}
              />
            </TableCell>
          </TableRow>
        );
      }
      return (
        <TableRow key={field}>
          <TableCell width="200em">{readableNames[field] || field}</TableCell>
          <TableCell>
            <TextField
              value={editedValues?.[field] || ''}
              onChange={handleChange}
              variant="filled"
              fullWidth
              size="small"
              hiddenLabel
              inputProps={{ style: { padding: '9px 10px', fontSize: '.9rem' } }}
            />
          </TableCell>
        </TableRow>
      );
    case 'boolean':
      return (
        <TableRow key={field}>
          <TableCell width="200em">{readableNames[field] || field}</TableCell>
          <TableCell>
            <Switch
              size="small"
              checked={editedValues?.[field] as boolean || false}
              onChange={handleChangeBoolean}
            />
          </TableCell>
        </TableRow>
      );
    case 'number':
      if (nonEditableFields.includes(field)) {
        return (
          <TableRow key={field}>
            <TableCell width="200em">
              {readableNames[field] || field}
            </TableCell>
            <TableCell>
              {`${bytesToMB(detailValue as number)} MB`}
            </TableCell>
          </TableRow>
        );
      }
      return (
        <TableRow key={field}>
          <TableCell>
            <FieldLabelWithTooltip field={field} readableNames={readableNames} />
          </TableCell>
          <TableCell>
            <TextField
              value={bytesToMB(editedValues?.[field] as number)}
              onChange={handleMBChange}
              variant="filled"
              fullWidth
              size="small"
              hiddenLabel
              sx={{ 'width': '100%',
                'padding': '0',
                'flexWrap': 'nowrap !important',
                '& .MuiFilledInput-root.Mui-focused': {
                  flexWrap: 'nowrap !important',
                } }}
              slotProps={{
                input: {
                  style: {
                    fontSize: '.9rem',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                  endAdornment:
  <InputAdornment position="end">
    <Typography fontSize="0.9rem">MB per month</Typography>
  </InputAdornment>,
                },
              }}
            />
          </TableCell>
        </TableRow>
      );
    case 'object':
      if (detailValue === null) {
        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>
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
          <TableCell width="200em">{readableNames[field] || field}</TableCell>
          <TableCell>{detailValue}</TableCell>
        </TableRow>
      );
  }
  return null;
}

export default EditableRow;
