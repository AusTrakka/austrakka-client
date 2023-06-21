import * as React from 'react';
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { TreeTypes } from '../PhylocanvasGL';

interface State {
  type: string,
}

export default function TreeNavigation(
  { state, onChange, fitInCanvas }: {
    state: State,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string[]>
    ) => void;
    fitInCanvas: CallableFunction },
) {
  return (
    <Grid>
      <FormControl sx={{ marginY: 1 }} size="small" fullWidth>
        <InputLabel id="tree-type-label">Type</InputLabel>
        <Select
          labelId="tree-type-label"
          id="tree-type"
          value={[state.type]}
          name="type"
          label="Type"
          onChange={onChange}
        >
          {
                  Object.keys(TreeTypes).map((type) => (
                    <MenuItem key={type} value={TreeTypes[type]}>{type}</MenuItem>
                  ))
                }
        </Select>
      </FormControl>
      <Button fullWidth onClick={() => { fitInCanvas(); }}>
        Reset Tree
      </Button>
    </Grid>
  );
}
