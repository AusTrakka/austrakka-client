import React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { FormControlLabel, FormGroup, Grid, Switch } from '@mui/material';
import InputSlider from './Slider';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(column: string, selectedColumns: string[], theme: Theme) {
  return {
    fontWeight:
      selectedColumns.indexOf(column) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

interface MetadataState {
  blocks: string[]
  showBlockHeaders: boolean
  blockHeaderFontSize: number,
  blockPadding: number,
  blockSize: number,
}

export default function MetadataControls(
  { columns, state, onChange }: {
    columns: string[],
    state: MetadataState,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>
    ) => void; },
) {
  const theme = useTheme();

  return (
    <Grid>
      <FormControl fullWidth size="small">
        <InputLabel id="column-label">Columns</InputLabel>
        <Select
          labelId="column-label"
          id="column"
          multiple
          name="blocks"
          value={state.blocks}
          onChange={onChange}
          input={<OutlinedInput label="Column" />}
          MenuProps={MenuProps}
        >
          {columns.map((column) => (
            <MenuItem
              key={column}
              value={column}
              style={getStyles(column, state.blocks, theme)}
            >
              {column}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch checked={state.showBlockHeaders} onChange={onChange} name="showBlockHeaders" />
          }
            label="Show headers"
          />
        </FormGroup>
      </FormControl>
      <FormControl fullWidth>
        <InputSlider
          name="blockHeaderFontSize"
          label="Font size"
          value={state.blockHeaderFontSize}
          onChange={onChange}
          min={1}
          max={24}
        />
      </FormControl>
      <FormControl fullWidth>
        <InputSlider
          name="blockSize"
          label="Block size"
          value={state.blockSize}
          onChange={onChange}
          min={1}
          max={50}
        />
      </FormControl>
      <FormControl fullWidth>
        <InputSlider
          name="blockPadding"
          label="Padding"
          value={state.blockPadding}
          onChange={onChange}
          min={1}
          max={20}
        />
      </FormControl>
    </Grid>
  );
}
