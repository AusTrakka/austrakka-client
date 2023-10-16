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
  keyValueLabelBlocks: boolean,
  nodeColumn: string,
}

export default function NodeAndLabelControls(
  { columns, visualColumns, state, onChange }: {
    columns: string[],
    visualColumns: string[],
    state: State,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>
    ) => void; },
) {
  const theme = useTheme();
  return (
    <Grid>
      <FormControl sx={{ marginY: 1 }} fullWidth size="small">
        <InputLabel id="column-label">Label columns</InputLabel>
        <Select
          labelId="column-label"
          id="column"
          multiple
          name="labelBlocks"
          value={state.labelBlocks}
          onChange={onChange}
          input={<OutlinedInput label="Label columns" />}
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
      <FormControl sx={{ marginY: 1 }} fullWidth size="small">
        <InputLabel id="column-label">Node Colouring</InputLabel>
        <Select
          labelId="column-label"
          id="column"
          multiple={false}
          name="nodeColumn"
          value={[state.nodeColumn]}
          onChange={onChange}
          input={<OutlinedInput label="Column Colour" />}
          MenuProps={MenuProps}
        >
          <MenuItem value="">
            <i>None</i>
          </MenuItem>
          {visualColumns.map((column) => (
            <MenuItem
              key={column}
              value={column}
            >
              {column}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <FormGroup>
          {state.labelBlocks.length > 0 ? (
            <FormControlLabel
              control={(
                <Switch
                  checked={state.keyValueLabelBlocks}
                  onChange={onChange}
                  name="keyValueLabelBlocks"
                />
                )}
              label="Key value label pairs"
            />
          )
            :
            <div />}
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
