import * as React from 'react';
import { FormControl, FormControlLabel, FormGroup, Grid, SelectChangeEvent, Switch } from '@mui/material';
import InputSlider from './Slider';

interface State {
  alignLabels: boolean,
  showLeafLabels: boolean,
  showInternalLabels: boolean,
  showBranchLengths: boolean,
  fontSize: number,
  nodeSize: number
}

export default function NodeAndLabelControls(
  { state, onChange }: {
    state: State,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>
    ) => void; },
) {
  return (
    <Grid>
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
