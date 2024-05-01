/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction } from 'react';
import { Autocomplete, Switch, TableCell, TableRow, TextField } from '@mui/material';
import { UserDetails } from '../../../types/dtos';
import { isoDateLocalDate } from '../../../utilities/helperUtils';

interface EditableRowProps {
  field: keyof UserDetails;
  detailValue: any;
  editedValues: UserDetails | null;
  setEditedValues: Dispatch<SetStateAction<UserDetails | null>>;
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
      if (field === 'created') {
        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>
              {isoDateLocalDate(detailValue)}
            </TableCell>
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
    case 'object':
      if (detailValue === null) {
        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>
              <TextField
                value={editedValues?.[field] as string || ''}
                onChange={handleChange}
                variant="outlined"
                fullWidth
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
