import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, Chip, TextField, Tooltip } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { Theme } from '../../../assets/themes/theme';
import type { Role } from '../../../types/dtos';
import { InfoTooltip } from '../RowRender/InfoTooltip';

interface RoleAutocompleteProps {
  roles: Role[];
  selectedRoles: Role[] | null;
  setSelectedRoles: Dispatch<SetStateAction<Role[] | null>>;
}

export function RoleAutocomplete(props: RoleAutocompleteProps) {
  const { roles, selectedRoles, setSelectedRoles } = props;

  return (
    <Autocomplete
      options={roles?.filter((r) => !selectedRoles?.some((sr) => sr.globalId === r.globalId)) || []}
      multiple
      limitTags={1}
      style={{ width: '19em' }}
      value={selectedRoles || []}
      disableCloseOnSelect
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.globalId === value.globalId}
      onChange={(_e, v) => setSelectedRoles(v)}
      renderOption={(_props, option, { selected }) => (
        <li {..._props} style={{ fontSize: '0.9em' }} key={option.globalId}>
          <Checkbox
            style={{ marginRight: '8px' }}
            checked={selected}
            icon={<CheckBoxOutlineBlank />}
            checkedIcon={<CheckBox />}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <InfoTooltip
              title={option.description || 'No description'}
              fontSize="inherit"
              color={Theme.PrimaryGrey500}
            />
            <span>{option.name}</span>
          </Box>
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
        })
      }
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
