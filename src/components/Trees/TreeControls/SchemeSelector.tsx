import React from 'react';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Stack, Tooltip } from '@mui/material';
import { allColorSchemes } from '../../../constants/schemes';

// Define your ColorScheme and allColorSchemes here

type ColorScheme = (value: number) => string;

interface SelectorProps {
  color: string;
  onColourChange: (color: string) => void;
}

export default function ColorSchemeSelector({ color, onColourChange }: SelectorProps) {
  const handleSchemeChange = (event: SelectChangeEvent<string>) => {
    onColourChange(event.target.value);
  };

  // Function to generate a thumbnail and return it within a Tooltip
  const generateThumbnailWithTooltip = (colorScheme: ColorScheme, schemeName: string) => (
    <Tooltip title={schemeName} arrow>
      <Stack direction="row" spacing={1} alignItems="center">
        <div
          style={{
            backgroundColor: colorScheme(0.1),
            width: '20px',
            height: '20px',
            border: '1px solid #dddddd',
          }}
        />
        <div
          style={{
            backgroundColor: colorScheme(0.3),
            width: '20px',
            height: '20px',
            border: '1px solid #dddddd',
          }}
        />
        <div
          style={{
            backgroundColor: colorScheme(0.5),
            width: '20px',
            height: '20px',
            border: '1px solid #dddddd',
          }}
        />
        <div
          style={{
            backgroundColor: colorScheme(0.7),
            width: '20px',
            height: '20px',
            border: '1px solid #dddddd',
          }}
        />
        <div
          style={{
            backgroundColor: colorScheme(0.9),
            width: '20px',
            height: '20px',
            border: '1px solid #dddddd',
          }}
        />
        <Typography variant="caption">{schemeName}</Typography>
      </Stack>
    </Tooltip>
  );

  return (
    <FormControl variant="standard" sx={{ marginX: 1, marginY: 1, minWidth: 220 }}>
      <Typography variant="caption">Color Map</Typography>
      <Select
        labelId="tree-select-colour-scheme"
        id="tree-colour-scheme"
        value={color}
        onChange={(e) => handleSchemeChange(e)}
        label="Colour Scheme"
        autoWidth
      >
        {Object.keys(allColorSchemes).map((schemeName) => (
          <MenuItem key={schemeName} value={schemeName}>
            {generateThumbnailWithTooltip(allColorSchemes[schemeName], schemeName)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
