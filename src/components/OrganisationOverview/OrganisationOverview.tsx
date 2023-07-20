import React, {
  memo, useEffect, useState,
} from 'react';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';

function OrgGroupSelector(props: any) {
  const { selectedGroup, setSelectedGroup, groups } = props;

  return (
    <FormControl variant="standard" sx={{ marginX: 1, marginTop: 1, minWidth: 220 }}>
      <InputLabel id="org-select-label">Organisation group</InputLabel>
      <Select
        labelId="org-select-label"
        id="org-select"
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        label="Organisation group"
        autoWidth
      >
        { // Need to add a check in here to account for an empty list of groups (and below)
            groups.map((group: any) => (
              <MenuItem
                value={group.name}
                key={group.name}
              >
                {group.name}
              </MenuItem>
            ))
        }
      </Select>
    </FormControl>
  );
}

function OrganisationOverview() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const groups = [
    { name: 'Dummy group 1' },
    { name: 'Dummy group 2' },
    { name: 'Dummy group 3' },
  ];
  useEffect(
    () => {

    },
    [],
  );
  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        <Grid container item xs={12} justifyContent="space-between">
          <Typography variant="h2" color="primary">Organisation Overview</Typography>
          <OrgGroupSelector
            groups={groups}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
          />
        </Grid>
        <Grid container item>
          Query builder to go here
        </Grid>
        <Grid container item>
          Table to go here
        </Grid>
      </Grid>
    </Box>
  );
}
export default memo(OrganisationOverview);
