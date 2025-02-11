/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction } from 'react';
import { Autocomplete, Checkbox, Chip, TextField, Tooltip } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { RolesV2 } from '../../../types/dtos';

interface RoleAutocompleteProps {
  roles: RolesV2[];
  selectedRoles: RolesV2[] | null;
  setSelectedRoles: Dispatch<SetStateAction<RolesV2[] | null>>;
}

export function RoleAutocomplete(props: RoleAutocompleteProps) {
  const { roles, selectedRoles, setSelectedRoles } = props;

  return (
    <Autocomplete
      options={roles?.filter(r => !selectedRoles?.some(sr => sr.globalId === r.globalId)) || []}
      multiple
      limitTags={1}
      style={{ width: '19em' }}
      value={selectedRoles || []}
      disableCloseOnSelect
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.globalId === value.globalId}
      onChange={(e, v) => setSelectedRoles(v)}
      renderOption={(_props, option, { selected }) => (
        <li {..._props} style={{ fontSize: '0.9em' }} key={option.globalId}>
          <Checkbox
            style={{ marginRight: '8px' }}
            checked={selected}
            icon={<CheckBoxOutlineBlank />}
            checkedIcon={<CheckBox />}
          />
          {option.name}
        </li>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const tagProps = getTagProps({ index });
          const { key, ...propsButKeyRemoved } = tagProps;
          return (
            <Tooltip title={option.name} key={key}>
              <Chip
                label={option.name}
                {...propsButKeyRemoved}
                style={{
                  maxWidth: '11em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              />
            </Tooltip>
          );
        })}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          hiddenLabel
          variant="filled"
          placeholder={selectedRoles?.length ? '' : 'Select Role'}
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
  );
}
