import * as React from 'react';
import { Autocomplete, AutocompleteChangeDetails, AutocompleteChangeReason, TextField } from '@mui/material';

export default function Search(
  { options, selectedIds, onChange }: {
    options: string[],
    selectedIds: string[],
    onChange: (
      event: React.SyntheticEvent<Element, Event>,
      value: string[],
      reason: AutocompleteChangeReason,
      details?: AutocompleteChangeDetails<string> | undefined
    ) => void; },
) {
  return (
    <Autocomplete
      multiple
      id="tags-outlined"
      size="small"
      limitTags={1}
      getOptionLabel={(option) => option}
      filterSelectedOptions
      freeSolo
      options={options}
      value={selectedIds}
      onChange={(event, newValue, reason, details) => {
        let selected: string[];
        if (reason === 'createOption') {
          const option = details?.option;
          const matches = options.filter((o) => o.includes(option as string));
          selected = newValue.slice(0, -1).concat(matches).filter((v, i, a) => a.indexOf(v) === i);
        } else {
          selected = newValue;
        }
        onChange(event, selected, reason);
      }}
      renderInput={params => {
        const { InputProps, ...restParams } = params;
        const { startAdornment, ...restInputProps } = InputProps;
        return (
          <TextField
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...restParams}
            label="Search"
            placeholder="..."
            InputProps={{
              ...restInputProps,
              startAdornment: (
                <div style={{
                  maxHeight: '250px',
                  overflowY: 'auto',
                }}
                >
                  {startAdornment}
                </div>
              ),
            }}
          />
        );
      }}
    />
  );
}
