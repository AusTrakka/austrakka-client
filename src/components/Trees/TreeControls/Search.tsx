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
      options={options}
      value={selectedIds}
      onChange={onChange}
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
