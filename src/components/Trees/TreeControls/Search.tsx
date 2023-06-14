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
      sx={{ maxHeight: '200px', overflow: 'auto', paddingY: 1 }}
      multiple
      id="tags-outlined"
      size="small"
      limitTags={3}
      getOptionLabel={(option) => option}
      filterSelectedOptions
      options={options}
      value={selectedIds}
      onChange={onChange}
      renderInput={(params) => (
        <TextField
        // eslint-disable-next-line react/jsx-props-no-spreading
          {...params}
          label="Search"
          placeholder="..."
        />
      )}
    />
  );
}
