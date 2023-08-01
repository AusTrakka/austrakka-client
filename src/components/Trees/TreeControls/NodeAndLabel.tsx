import * as React from 'react';
import { FormControl, FormControlLabel, FormGroup, Grid, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Switch } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InputSlider from './Slider';
import getStyles, { MenuProps } from './utils';

interface State {
  alignLabels: boolean,
  showLeafLabels: boolean,
  showInternalLabels: boolean,
  showBranchLengths: boolean,
  fontSize: number,
  nodeSize: number,
  labelBlocks: string[],
}

export default function NodeAndLabelControls(
  { columns, state, onChange }: {
    columns: string[],
    state: State,
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
          name="labelBlocks"
          value={state.labelBlocks}
          onChange={onChange}
          input={<OutlinedInput label="Column" />}
          MenuProps={MenuProps}
        >
          {columns.map((column) => (
            <MenuItem
              key={column}
              value={column}
              style={getStyles(column, state.labelBlocks, theme)}
            >
              {column}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <FormGroup>
          <FormControlLabel
            control={(
              <Switch
                checked={state.alignLabels}
                onChange={onChange}
                name="alignLabels"
              />
            )}
            label="Align labels"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={state.showLeafLabels}
                onChange={onChange}
                name="showLeafLabels"
              />
          )}
            label="Show tip labels"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={state.showInternalLabels}
                onChange={onChange}
                name="showInternalLabels"
              />
          )}
            label="Show internal labels"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={state.showBranchLengths}
                onChange={onChange}
                name="showBranchLengths"
              />
          )}
            label="Show branch lengths"
          />
        </FormGroup>
      </FormControl>
      {state.showLeafLabels || state.showInternalLabels || state.showBranchLengths
        ? (
          <FormControl fullWidth>
            <InputSlider
              name="fontSize"
              label="Font size"
              value={state.fontSize}
              onChange={onChange}
              min={1}
              max={24}
            />
          </FormControl>
        )
        : <div />}
      <FormControl fullWidth>
        <InputSlider
          name="nodeSize"
          label="Node size"
          value={state.nodeSize}
          onChange={onChange}
          min={1}
          max={24}
        />
      </FormControl>
    </Grid>
  );
}
