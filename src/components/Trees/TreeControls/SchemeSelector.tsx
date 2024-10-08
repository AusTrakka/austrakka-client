import React from 'react';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { InputLabel, ListSubheader, MenuItem, Stack, Tooltip } from '@mui/material';
import {
  ColorSchemeNames, cyclical, defaultColorSchemeName,
  discreteColorSchemes, diverging, sequential,
} from '../../../constants/schemes';
import { generateColorSchemeThumbnail } from '../../../utilities/colourUtils';

interface SelectorProps {
  onColourChange: (value: string) => void;
  selectedScheme: string | null | undefined;
  size?: 'small' | 'medium';
  variant?: 'standard' | 'outlined' | 'filled';
}

export default function ColorSchemeSelector({
  onColourChange,
  selectedScheme,
  size,
  variant,
}: SelectorProps) {
  const handleSchemeChange = (event: SelectChangeEvent<string>) => {
    onColourChange(event.target.value);
  };
  const generateThumbnailWithTooltip =
      (colorScheme: string[], schemeName: string, showName: boolean) => (
        <Tooltip title={schemeName} arrow>
          <Stack direction="row" spacing={1}>
            <div
              style={{
                backgroundColor: colorScheme[0],
                width: '20px',
                height: '20px',
                border: '1px solid var(--primary-grey-300)',
              }}
            />
            <div
              style={{
                backgroundColor: colorScheme[1],
                width: '20px',
                height: '20px',
                border: '1px solid var(--primary-grey-300)',
              }}
            />
            <div
              style={{
                backgroundColor: colorScheme[2],
                width: '20px',
                height: '20px',
                border: '1px solid var(--primary-grey-300)',
              }}
            />
            <div
              style={{
                backgroundColor: colorScheme[3],
                width: '20px',
                height: '20px',
                border: '1px solid var(--primary-grey-300)',
              }}
            />
            <div
              style={{
                backgroundColor: colorScheme[4],
                width: '20px',
                height: '20px',
                border: '1px solid var(--primary-grey-300)',
              }}
            />
            {showName && (
            <Typography variant="caption">
              {ColorSchemeNames[schemeName as keyof typeof ColorSchemeNames]}
            </Typography>
            )}
          </Stack>
        </Tooltip>
      );

  return (
    <FormControl variant={variant} size={size} sx={{ marginX: 1, marginY: 1, minWidth: 180 }}>
      {variant === 'outlined' ?
        <InputLabel id="colour-field-select-label">Color Scheme</InputLabel> :
        <Typography variant="caption">Color Scheme</Typography>}
      <Select
        labelId="tree-select-colour-scheme"
        id="tree-colour-scheme"
        label={variant === 'outlined' ? 'Color Scheme' : undefined}
        defaultValue={defaultColorSchemeName}
        value={selectedScheme ?? defaultColorSchemeName}
        onChange={handleSchemeChange}
        style={{ width: '180px' }}
        renderValue={(value: string) => (
          generateThumbnailWithTooltip(
            generateColorSchemeThumbnail(value),
            value,
            false,
          )
        )}
      >
        <ListSubheader>Discrete</ListSubheader>
        {Object.keys(discreteColorSchemes).map((schemeName) => (
          <MenuItem key={schemeName} value={schemeName}>
            {generateThumbnailWithTooltip(
              generateColorSchemeThumbnail(schemeName),
              schemeName,
              true,
            )}
          </MenuItem>
        ))}
        
        <ListSubheader>Diverging</ListSubheader>
        {Object.keys(diverging).map((schemeName) => (
          <MenuItem key={schemeName} value={schemeName}>
            {generateThumbnailWithTooltip(
              generateColorSchemeThumbnail(schemeName),
              schemeName,
              true,
            )}
          </MenuItem>
        ))}
        <ListSubheader>Sequential</ListSubheader>
        {Object.keys(sequential).map((schemeName) => (
          <MenuItem key={schemeName} value={schemeName}>
            {generateThumbnailWithTooltip(
              generateColorSchemeThumbnail(schemeName),
              schemeName,
              true,
            )}
          </MenuItem>
        ))}
        <ListSubheader>Cyclical</ListSubheader>
        {Object.keys(cyclical).map((schemeName) => (
          <MenuItem key={schemeName} value={schemeName}>
            {generateThumbnailWithTooltip(
              generateColorSchemeThumbnail(schemeName),
              schemeName,
              true,
            )}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

ColorSchemeSelector.defaultProps = {
  size: 'medium',
  variant: 'standard',
};
