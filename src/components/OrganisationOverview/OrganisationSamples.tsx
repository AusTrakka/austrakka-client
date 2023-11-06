import React, { useState } from 'react';
import { Alert, Box, FormControl, InputLabel, LinearProgress, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { Error } from '@mui/icons-material';
import SampleTable from '../SampleTable/SampleTable';
import LoadingState from '../../constants/loadingState';
import { UserRoleGroup } from '../../types/dtos';

interface OrgansiationSampleProps {
  defaultGroup: UserRoleGroup;
  groups: UserRoleGroup[];
  groupStatus: LoadingState;
  groupStatusMessage: string;
}

interface OrgGroupSelectorProps {
  selectedGroup: UserRoleGroup;
  setSelectedGroup: (group: UserRoleGroup) => void;
  groups: UserRoleGroup[];
  groupStatus: LoadingState;
  groupStatusMessage: string;
}

function OrgGroupSelector(props: OrgGroupSelectorProps) {
  const { selectedGroup, setSelectedGroup, groups, groupStatus, groupStatusMessage } = props;
  return (
    <>
      {groupStatus === LoadingState.ERROR
        ? (
          <Tooltip title={groupStatusMessage}>
            <Error color="error" />
          </Tooltip>
        )
        : null }

      <FormControl
        variant="standard"
        sx={{ marginX: 1, margin: 1, minWidth: 220, minHeight: 20 }}
        error={groupStatus === LoadingState.ERROR}
      >
        <InputLabel id="org-select-label">Organisation group</InputLabel>
        <Select
          labelId="org-select-label"
          id="org-select"
          value={selectedGroup.group.id} // Use a unique identifier as the value
          onChange={(e) => {
            const selectedGroupId = e.target.value;
            const selectedGroupObject = groups.find(group => group.group.id === selectedGroupId);

            if (selectedGroupObject) {
              setSelectedGroup(selectedGroupObject);
            }
          }}
          label="Organisation group"
          autoWidth
        >
          {groups.map((urg: UserRoleGroup) => (
            <MenuItem
              value={urg.group.id} // Use the group's ID as the value
              key={urg.group.id}
            >
              {urg.group.name}
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
    </>
  );
}

function OrganisationSamples(props: OrgansiationSampleProps) {
  const { defaultGroup, groups, groupStatus, groupStatusMessage } = props;
  const [selectedGroup, setSelectedGroup] = useState<UserRoleGroup | null>(defaultGroup || null);

  if (groupStatus === LoadingState.ERROR) {
    return (
      <Alert severity="error">
        {groupStatusMessage}
      </Alert>
    );
  }

  // Now, you can safely access selectedGroup and its properties
  return (
    <Box>
      <Typography sx={{ paddingBottom: 2 }} align="left" variant="subtitle2" color="primary">
        View samples owned by your organisation.
        Please note you will only be able to view
        <em> all </em>
        data for the organisation you are in,
        if you are a
        <b> viewer </b>
        in your organisation&lsquo;s
        <b> Owner group</b>
        s.
      </Typography>
      <OrgGroupSelector
        groups={groups}
        groupStatus={groupStatus}
        groupStatusMessage={groupStatusMessage}
        selectedGroup={selectedGroup!}
        setSelectedGroup={setSelectedGroup}
      />
      <SampleTable
        groupContext={selectedGroup!.group.id}
        groupName={undefined}
      />
    </Box>
  );
}
export default OrganisationSamples;
