import React, { useState } from 'react';
import { Alert, Box, FormControl, InputLabel, LinearProgress, MenuItem, Select, Tooltip } from '@mui/material';
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
          defaultValue=""
          value={groups.length !== 0 ? selectedGroup.group.name : ''}
          onChange={(e) => {
            const selectedGroupName = e.target.value;
            const selectedGroupObject = groups.find(group =>
              group.group.name === selectedGroupName);

            if (selectedGroupObject) {
              setSelectedGroup(selectedGroupObject);
            }
          }}
          label="Organisation group"
          autoWidth
        >
          { groups.map((group) => (
            <MenuItem
              value={group.group.id}
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
