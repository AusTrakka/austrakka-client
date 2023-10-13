import React, { memo, useEffect, useState } from 'react';
import { Box, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { Error } from '@mui/icons-material';
import { ResponseObject, getUserGroups } from '../../utilities/resourceUtils';
import SampleTable from '../SampleTable/SampleTable';
import LoadingState from '../../constants/loadingState';
import { useApi } from '../../app/ApiContext';

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
                value={group.group}
                key={group.group.name}
              >
                {group.group.name}
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
  const [selectedGroup, setSelectedGroup] = useState({
    id: undefined,
    name: '',
  });
  const [groups, setGroups] = useState([]);
  const [groupStatus, setGroupStatus] = useState(LoadingState.IDLE);
  const [groupStatusMessage, setGroupStatusMessage] = useState('');
  const { token, tokenLoading } = useApi();

  async function getGroups() {
    setGroupStatus(LoadingState.LOADING);
    const groupResponse: ResponseObject = await getUserGroups(token);
    if (groupResponse.status === 'Success') {
      // Filter out only owner groups that a user is a viewer in
      const { organisation, userRoleGroup } = groupResponse.data;
      // This is strictly Owner and Everyone groups
      // Could instead check group organisation, if we want to include ad-hoc org groups
      const orgViewerGroups = userRoleGroup.filter((roleGroup: any) =>
        (roleGroup.group.name === `${organisation.abbreviation}-Owner`
            || roleGroup.group.name === `${organisation.abbreviation}-Everyone`)
          && (roleGroup.role.name === 'Viewer'))
        .sort((a: any, b: any) => {
          // Owner group first
          if (a.group.name.endsWith('-Owner') && b.group.name.endsWith('-Owner')) return 0;
          if (a.group.name.endsWith('-Owner')) return -1;
          if (b.group.name.endsWith('-Owner')) return 1;
          return 0;
        });
      setGroups(orgViewerGroups);
      if (orgViewerGroups.length) {
        setSelectedGroup(orgViewerGroups[0].group);
      }
      setGroupStatus(LoadingState.SUCCESS);
    } else {
      setGroupStatus(LoadingState.ERROR);
      setGroupStatusMessage(groupResponse.message);
    }
  }

  useEffect(() => {
    if (tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING
    ) {
      getGroups();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenLoading]);

  return (
    <Box>
      <Grid container direction="row">
        <Typography variant="h2" color="primary">Organisation Data</Typography>
        <Grid container justifyContent="space-between">
          <Grid item xs={8}>
            <Typography sx={{ paddingTop: 2, paddingBottom: 2 }} variant="subtitle2" color="primary">
              View samples owned by your organisation.
              Please note you will only be able to view
              <em> all </em>
              data for the organisation you are in,
              if you are a
              <b> viewer </b>
              in your organisation&lsquo;s
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
        groupContext={selectedGroup.id}
      />
    </Box>
  );
}
export default memo(OrganisationOverview);
