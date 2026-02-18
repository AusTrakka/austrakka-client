import React, { Dispatch, SetStateAction } from 'react';
import { Palette } from '@mui/icons-material';
import { Tooltip, IconButton } from '@mui/material';
import { Theme } from '../../assets/themes/theme';

interface HeaderColourToggleProps {
  colourBySource: boolean;
  setColourBySource: Dispatch<SetStateAction<boolean>>;
}

function HeaderColourToggle(props: HeaderColourToggleProps) {
  const { colourBySource, setColourBySource } = props;
  
  return (
    <Tooltip title={colourBySource ? 'Hide column header colours' : 'Colour column headers by field source'} placement="top" arrow>
      <IconButton
        onClick={() => setColourBySource(!colourBySource)}
        aria-label="toggle coloured headers"
        sx={{ color: colourBySource ? Theme.SecondaryMain : null }}
      >
        <Palette />
      </IconButton>
    </Tooltip>
  );
}

export default HeaderColourToggle;
