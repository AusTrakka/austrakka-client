import React, { memo, useRef } from 'react';
import { Box, IconButton, TextField, Tooltip } from '@mui/material';
import { ManageSearch } from '@mui/icons-material';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
}

function SearchInput({ placeholder = '', label = 'Search', value, onChange }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box style={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title="Keyword Search" placement="top">
        <IconButton onClick={() => inputRef.current?.focus()}>
          <ManageSearch />
        </IconButton>
      </Tooltip>
      <TextField
        inputRef={inputRef}
        sx={{
          'marginBottom': 1,
          'width': value ? '200px' : '0',
          '&:focus-within': {
            width: 200,
          },
          'transition': 'width 0.5s',
        }}
        id="global-filter"
        label={label}
        type="search"
        variant="standard"
        color="success"
        size="small"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </Box>
  );
}

SearchInput.defaultProps = {
  placeholder: 'Search...',
  label: 'Search',
};

export default memo(SearchInput);
