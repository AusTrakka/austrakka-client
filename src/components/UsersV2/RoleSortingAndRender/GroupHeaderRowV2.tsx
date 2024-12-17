/* eslint-disable react/jsx-props-no-spreading */

// TODO: come back to this, as this page cannot be accessed at the moment
// This is the V2 version of adding roles to a record/group
import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Stack,
  Autocomplete,
  Checkbox, TextField,
} from '@mui/material';
import {
  AddCircle,
  CheckBox,
  CheckBoxOutlineBlank,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from '@mui/icons-material';

interface GroupHeaderRowProps {
  recordType: string;
  openGroupRoles: string[];
  handleGroupRoleToggle: (groupName: string) => void;
  editing: boolean;
}

function GroupHeaderRowV2(props: GroupHeaderRowProps) {
  const {
    recordType,
    openGroupRoles,
    handleGroupRoleToggle,
    editing,
  } = props;
  const [selectedResources, setSelectedResources] = useState<any[] | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<any[] | null>(null);
  
  // need to fetch roles for said resource type
  // will use temp list for now
  const dummyRoles = [
    { name: 'AustTrakkaAdmin', roleId: '1' },
    { name: 'AustTrakkaProcess', roleId: '2' },
    { name: 'AustTrakkaUser', roleId: '3' },
  ];
  
  // then I will need fetch the resources under a resource type
  const dummyResources = [
    { name: 'tenant1', resourceId: '1' },
    { name: 'tenant2', resourceId: '2' },
    { name: 'tenant3', resourceId: '3' },
  ];

  const isAddButtonEnabled = selectedResources !== null && selectedRoles !== null;

  return (
    <TableRow key={recordType} style={{ backgroundColor: 'var(--primary-grey)', borderRadius: '6px', border: 'none' }}>
      <TableCell>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => handleGroupRoleToggle(recordType)}
          >
            {openGroupRoles.includes(recordType) ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
          </IconButton>
          <Typography variant="body2">{recordType}</Typography>
        </div>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1}>
          {editing ? (
            <>
              <Autocomplete
                options={dummyResources}
                multiple
                limitTags={1}
                style={{ width: '19em' }}
                value={selectedResources || []}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                onChange={(e, v) => setSelectedResources(v)}
                renderOption={(_props, option, { selected }) => (
                  <li {..._props} style={{ fontSize: '0.9em' }}>
                    <Checkbox
                      style={{ marginRight: '8px' }}
                      checked={selected}
                      icon={<CheckBoxOutlineBlank />}
                      checkedIcon={<CheckBox />}
                    />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    hiddenLabel
                    placeholder="Select Group"
                    variant="filled"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      inputProps: {
                        ...params.inputProps,
                        style: {
                          fontSize: '0.9em',
                        },
                      },
                    }}
                  />
                )}
              />
              <Autocomplete
                options={dummyRoles}
                multiple
                limitTags={1}
                style={{ width: '19em' }}
                value={selectedRoles || []}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                onChange={(e, v) => setSelectedRoles(v)}
                renderOption={(_props, option, { selected }) => (
                  <li {..._props} style={{ fontSize: '0.9em' }}>
                    <Checkbox
                      style={{ marginRight: '8px' }}
                      checked={selected}
                      icon={<CheckBoxOutlineBlank />}
                      checkedIcon={<CheckBox />}
                    />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    hiddenLabel
                    variant="filled"
                    placeholder="Select Role"
                    InputProps={{
                      ...params.InputProps,
                      inputProps: {
                        ...params.inputProps,
                        style: {
                          fontSize: '0.9em',
                        },
                      },
                    }}
                  />
                )}
              />
              <div style={{ display: 'flex' }}>
                <IconButton
                  aria-label="add"
                  size="small"
                  color={isAddButtonEnabled ? 'success' : 'default'}
                  onClick={() => {
                    /* handleAddGroupRole();
                    if (!openGroupRoles.includes(groupType)) {
                      handleGroupRoleToggle(groupType);
                    } */
                  }}
                  disabled={!isAddButtonEnabled}
                >
                  <AddCircle />
                </IconButton>
              </div>
            </>
          ) : null}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default GroupHeaderRowV2;
