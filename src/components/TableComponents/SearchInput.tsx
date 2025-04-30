import React, { memo, useRef } from 'react';
import { Box, IconButton, IconButtonProps, styled, TextField, Tooltip } from '@mui/material';
import { ManageSearch } from '@mui/icons-material';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
}

// Define interface for our custom props
interface HoverableIconButtonProps extends IconButtonProps {
  isHovered?: string;
}

// Create a styled version with proper typing
const HoverableIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isHovered',
})<HoverableIconButtonProps>(({ theme, isHovered }) => ({
  ...(isHovered === 'true' && {
    backgroundColor: theme.palette.action.hover,
  }),
}));

function SearchInput({ placeholder = '', label = 'Search', value, onChange }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <Box style={{ position: 'relative', display: 'inline-block' }}>
      {/* Invisible Clickable Area */}
      <Box
        style={{
          position: 'absolute',
          top: '-10px',
          bottom: '-10px',
          left: '-10px',
          right: '-10px',
          width: '70%',
          height: '100%',
          zIndex: 3,
          cursor: 'pointer',
        }}
        onClick={() => inputRef.current?.focus()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      <Box style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
        pointerEvents: 'none',
      }}
      >
        <Tooltip title="Keyword Search" placement="top">
          <HoverableIconButton
            onClick={() => inputRef.current?.focus()}
            style={{ pointerEvents: 'none' }}
            isHovered={isHovered.toString()}
          >
            <ManageSearch />
          </HoverableIconButton>
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
            'pointerEvents': 'auto',
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
    </Box>
  );
}

SearchInput.defaultProps = {
  placeholder: 'Search...',
  label: 'Search',
};

export default memo(SearchInput);
