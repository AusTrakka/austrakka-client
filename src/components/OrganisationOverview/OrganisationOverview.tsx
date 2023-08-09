import React, { memo, useEffect, useState } from 'react';
import { Box, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { Error } from '@mui/icons-material';
import { ResponseObject, getGroupList } from '../../utilities/resourceUtils';
import SampleTable from '../SampleTable/SampleTable';
import LoadingState from '../../constants/loadingState';
import { Group } from '../../types/dtos';

function OrgGroupSelector(props: any) {
  const { selectedGroup, setSelectedGroup, groups, groupStatus, groupStatusMessage } = props;

  return (
    <Grid container direction="row" justifyContent="center" alignItems="flex-end">
      <Grid item sx={{ marginBottom: 1 }}>
        {groupStatus === LoadingState.ERROR
          ? (
            <Tooltip title={groupStatusMessage}>
              <Error color="error" />
            </Tooltip>
          )
          : null }
      </Grid>
      <Grid item>
        <FormControl
          variant="standard"
          sx={{ marginX: 1, margin: 1, minWidth: 220, minHeight: 20 }}
          error={groupStatus === LoadingState.ERROR}
        >
          <InputLabel id="org-select-label">Organisation group</InputLabel>
          <Select
            labelId="org-select-label"
            id="org-select"
            defaultValue=""
            value={groups.length !== 0 ? selectedGroup : ''}
            onChange={(e) => setSelectedGroup(e.target.value)}
            label="Organisation group"
            autoWidth
          >
            { groups.map((group: any) => (
              <MenuItem
                value={group}
                key={group.name}
              >
                {group.name}
              </MenuItem>
            )) }
            { groups.length === 0 ? (
              <MenuItem disabled>No owner groups available</MenuItem>
            ) : null}
          </Select>
          {groupStatus === LoadingState.LOADING
            ? (
              <LinearProgress
                color="secondary"
              />
            )
            : null }
        </FormControl>
      </Grid>

    </Grid>
  );
}

function OrganisationOverview() {
  const [selectedGroup, setSelectedGroup] = useState<Group>({
    groupId: undefined,
    name: '',
    lastUpdated: '',
    lastUpdatedBy: '',
    created: '',
    createdBy: '',
    organisation: {
      abbreviation: '',
    },
  });
  const [groups, setGroups] = useState([]);
  const [groupStatus, setGroupStatus] = useState(LoadingState.IDLE);
  const [groupStatusMessage, setGroupStatusMessage] = useState('');

  async function getGroups() {
    setGroupStatus(LoadingState.LOADING);
    const groupResponse: ResponseObject = await getGroupList();
    if (groupResponse.status === 'Success') {
      // Filter out only owner groups
      const ownerGroups = groupResponse.data.filter((group: any) => group.name.includes('-Owner'));
      setGroups(ownerGroups);
      if (ownerGroups.length) {
        setSelectedGroup(ownerGroups[0]);
      }
      setGroupStatus(LoadingState.SUCCESS);
    } else {
      setGroupStatus(LoadingState.ERROR);
      setGroupStatusMessage(groupResponse.message);
    }
  }

  useEffect(() => {
    getGroups();
  }, []);

  return (
    <Box>
      <Grid container direction="row">
        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h2" color="primary">Organisation Overview</Typography>
            <Typography sx={{ paddingTop: 2, paddingBottom: 2 }} variant="subtitle2" color="primary">
              View samples shared with your organisation.
              Please note you will only be able to view samples for the organisation you are in,
              if you are in the organisation&lsquo;s
              <b> Owner group</b>
              .
            </Typography>
          </Grid>
          <Grid item alignItems="center">
            <OrgGroupSelector
              groups={groups}
              groupStatus={groupStatus}
              groupStatusMessage={groupStatusMessage}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
            />
          </Grid>
        </Grid>
      </Grid>
      <SampleTable
        groupContext={selectedGroup.groupId}
      />
    </Box>
  );
}
export default memo(OrganisationOverview);
