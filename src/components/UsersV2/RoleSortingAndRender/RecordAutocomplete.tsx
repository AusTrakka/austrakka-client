/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction } from 'react';
import { Autocomplete, Checkbox, Chip, TextField, Tooltip } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { MinifiedRecord } from '../../../types/userDetailEdit.interface';

interface RecordAutocompleteProps {
  records: MinifiedRecord[];
  selectedRecords: MinifiedRecord[] | null;
  setSelectedRecords: Dispatch<SetStateAction<MinifiedRecord[] | null>>;
  recordType: string;
}

export function RecordAutocomplete(props: RecordAutocompleteProps) {
  const { records, selectedRecords, setSelectedRecords, recordType } = props;

  return (
    <Autocomplete
      options={records?.filter(r => !selectedRecords?.some(sr => sr.id === r.id)) || []}
      multiple
      disabled={recordType === 'Tenant'}
      limitTags={1}
      style={{ width: '19em' }}
      value={selectedRecords || []}
      disableCloseOnSelect
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => option.abbrev}
      onChange={(e, v) => setSelectedRecords(v)}
      renderOption={(_props, option, { selected }) => (
        <li {..._props} style={{ fontSize: '0.9em' }} key={option.id}>
          <Checkbox
            style={{ marginRight: '8px' }}
            checked={selected}
            icon={<CheckBoxOutlineBlank />}
            checkedIcon={<CheckBox />}
          />
          {option.abbrev}
        </li>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const tagProps = getTagProps({ index });
          const { key, ...propsButKeyRemoved } = tagProps;
          return (
            <Tooltip title={option.abbrev} key={key}>
              <Chip
                label={option.abbrev}
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
          hiddenLabel
          placeholder={selectedRecords?.length ? '' : 'Select Group'}
          variant="filled"
          size="small"
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
