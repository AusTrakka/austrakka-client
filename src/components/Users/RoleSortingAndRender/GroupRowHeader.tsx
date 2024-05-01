/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { TableRow, TableCell, IconButton, Typography, Autocomplete, TextField } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, AddCircle } from '@mui/icons-material';
import { Group, GroupRole, Role, UserDetails } from '../../../types/dtos';
import { sortGroups } from '../Sorting/groupSorting';

interface GroupHeaderRowProps {
  groupType: string;
  groupMapSize: number;
  user: UserDetails;
  allGroups: Group[];
  allRoles: Role[];
  editing: boolean;
  setOpenDupSnackbar: Dispatch<SetStateAction<boolean>>;
  openGroupRoles: string[];
  handleGroupRoleToggle: (groupName: string) => void;
  existingGroupRoles: GroupRole[];
  updateUserGroupRoles: (groupRoles: GroupRole[]) => void;
}

function GroupHeaderRow(props: GroupHeaderRowProps) {
  const {
    groupType,
    groupMapSize,
    user,
    allGroups,
    allRoles,
    editing,
    openGroupRoles,
    handleGroupRoleToggle,
    existingGroupRoles,
    setOpenDupSnackbar,
    updateUserGroupRoles,
  } = props;

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    setSelectedGroup(null);
    setSelectedRole(null);
  }, [editing]);

  const getGroupOptions = () => {
    const [personalOrgGroups, foriegnOrgGroups, restoftheGroups] = sortGroups(allGroups, user);

    switch (groupType) {
      case 'Home Organisation':
        return personalOrgGroups;
      case 'Other Organisations':
        return foriegnOrgGroups;
      case 'Projects and Other Groups':
        return restoftheGroups;
      default:
        return [];
    }
  };

  const groupOptions = editing ? getGroupOptions() : [];

  const handleAddGroupRole = () => {
    if (selectedGroup && selectedRole) {
      const newGroupRole: GroupRole = {
        group: selectedGroup,
        role: {
          id: selectedRole.roleId,
          name: selectedRole.name,
        },
      };

      if (existingGroupRoles.some((groupRole) =>
        groupRole.group.groupId === newGroupRole.group.groupId &&
        groupRole.role.id === newGroupRole.role.id)) {
        setOpenDupSnackbar(true);
        return;
      }

      const updatedGroupRoles = [...existingGroupRoles, newGroupRole];

      updateUserGroupRoles(updatedGroupRoles);
      setSelectedGroup(null);
      setSelectedRole(null);
    }
  };

  const isAddButtonEnabled = selectedGroup !== null && selectedRole !== null;

  return (
    <TableRow>
      <TableCell width="250em">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => handleGroupRoleToggle(groupType)}
            disabled={!editing && groupMapSize === 0}
          >
            {openGroupRoles.includes(groupType) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
          {groupMapSize === 0 ? (
            <Typography variant="body2" sx={{ color: 'grey' }}>
              {groupType}
            </Typography>
          ) : (
            <Typography variant="body2">{groupType}</Typography>
          )}

        </div>
      </TableCell>
      <TableCell>
        <div style={{ display: 'flex' }}>
          {editing ? (
            <>
              <Autocomplete
                options={groupOptions}
                style={{ marginRight: '1em', width: '15em' }}
                getOptionLabel={(option) => option.name}
                onChange={(e, v) => setSelectedGroup(v)}
                renderOption={(_props, option) => (
                  <li {..._props} style={{ fontSize: '0.9em' }}>
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
                options={allRoles}
                style={{ width: '15em', marginRight: '1em' }}
                getOptionLabel={(option) => option.name}
                onChange={(e, v) => setSelectedRole(v)}
                renderOption={(_props, option) => (
                  <li {..._props} style={{ fontSize: '0.9em' }}>
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
              <IconButton
                aria-label="add"
                size="small"
                color={isAddButtonEnabled ? 'success' : 'default'}
                onClick={handleAddGroupRole}
                disabled={!isAddButtonEnabled}
              >
                <AddCircle />
              </IconButton>
            </>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default GroupHeaderRow;
