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
  columns: string[]
  alignLabels: boolean
  showBlockHeaders: boolean
  blockHeaderFontSize: number,
  blockPadding: number,
  blockSize: number,
}

export default function MetadataControls(
  { columns, state, onChange }: {
    columns: string[],
    state: MetadataState,
    onChange: CallableFunction },
) {
  const theme = useTheme();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>,
  ) => {
    // Detect if the event is coming from a checkbox
    const isCheckbox = (event.target as HTMLInputElement).checked !== undefined;
    onChange({
      ...state,
      [event.target.name]:
        isCheckbox ? (event.target as HTMLInputElement).checked : event.target.value,
    });
  };

  return (
    <Grid>
      <FormControl fullWidth size="small">
        <InputLabel id="column-label">Columns</InputLabel>
        <Select
          labelId="column-label"
          id="column"
          multiple
          name="columns"
          value={state.columns}
          onChange={handleChange}
          input={<OutlinedInput label="Column" />}
          MenuProps={MenuProps}
        >
          {columns.map((column) => (
            <MenuItem
              key={column}
              value={column}
              style={getStyles(column, state.columns, theme)}
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
              <Switch checked={state.alignLabels} onChange={handleChange} name="alignLabels" />
          }
            label="Align metadata"
          />
          <FormControlLabel
            control={
              <Switch checked={state.showBlockHeaders} onChange={handleChange} name="showBlockHeaders" />
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
          onChange={handleChange}
          min={1}
          max={24}
        />
      </FormControl>
      <FormControl fullWidth>
        <InputSlider
          name="blockSize"
          label="Block size"
          value={state.blockSize}
          onChange={handleChange}
          min={1}
          max={50}
        />
      </FormControl>
      <FormControl fullWidth>
        <InputSlider
          name="blockPadding"
          label="Padding"
          value={state.blockPadding}
          onChange={handleChange}
          min={1}
          max={20}
        />
      </FormControl>
    </Grid>
  );
}
