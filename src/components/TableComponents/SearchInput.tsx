import { ManageSearch } from '@mui/icons-material';
import { Box, IconButton, type SxProps, TextField, Tooltip } from '@mui/material';
import './SearchInput.css';
import type { Theme } from '@mui/material/styles';
import { type ChangeEvent, memo, useRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  forceExpanded?: boolean;
  iconSx?: SxProps<Theme>;
}

function SearchInput({
  placeholder = 'Search...',
  label = 'Search',
  value,
  onChange,
  forceExpanded = false,
  iconSx,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box className="table-search-input" sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title="Keyword Search" placement="top">
        <IconButton size="small" onClick={() => inputRef.current?.focus()}>
          <ManageSearch sx={iconSx} />
        </IconButton>
      </Tooltip>
      <TextField
        inputRef={inputRef}
        id="global-filter"
        type="search"
        variant="standard"
        color="success"
        size="small"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        slotProps={{ htmlInput: { 'aria-label': label } }}
        sx={{
          width: forceExpanded || value ? 200 : 0,
          overflow: 'hidden',
          transition: (theme) => theme.transitions.create('width'),
          '&:focus-within': {
            width: 200,
          },
          '& .MuiInputBase-input': {
            minWidth: 0,
          },
        }}
      />
    </Box>
  );
}

export default memo(SearchInput);
