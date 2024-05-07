/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { TableRow, TableCell, IconButton, Typography, Autocomplete, TextField, Stack } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, AddCircle } from '@mui/icons-material';
import { Group, GroupRole, Role, User } from '../../../types/dtos';
import { RoleName, orgRoles, projectRoles } from '../../../permissions/roles';
import { sortGroups } from '../groupSorting';

interface GroupHeaderRowProps {
  groupType: string;
  groupMapSize: number;
  user: User;
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
  const [selectedRole, setSelectedRole] = useState<Role[] | null>(null);

  useEffect(() => {
    setSelectedGroup(null);
    setSelectedRole(null);
  }, [editing]);

  const getRoleOptions = () => {
    switch (groupType) {
      case 'Home Organisation':
        return allRoles.filter((role) => orgRoles.includes(role.name as RoleName));
      case 'Other Organisations':
        return allRoles.filter((role) => orgRoles.includes(role.name as RoleName));
      case 'Projects and Other Groups':
        return allRoles.filter((role) => projectRoles.includes(role.name as RoleName));
      default:
        return [];
    }
  };

  const allRolesForGroup = getRoleOptions();

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

  const addGroupRoles = () => {
    const newGroupRoles: GroupRole[] = (selectedRole as Role[]).map((role) => ({
      group: selectedGroup!,
      role: {
        id: role.roleId,
        name: role.name,
      },
    }));

    const duplicateFound = newGroupRoles.some((newGroupRole) =>
      existingGroupRoles.some(
        (groupRole) =>
          groupRole.group.groupId === newGroupRole.group.groupId &&
          groupRole.role.id === newGroupRole.role.id,
      ));

    if (duplicateFound) {
      setOpenDupSnackbar(true);
      return;
    }

    const updatedGroupRoles = [...existingGroupRoles, ...newGroupRoles];
    updateUserGroupRoles(updatedGroupRoles);
    setSelectedGroup(null);
    setSelectedRole(null);
  };

  const handleAddGroupRole = () => {
    if (selectedGroup && selectedRole) {
      addGroupRoles();
    }
  };

  const isAddButtonEnabled = selectedGroup !== null && selectedRole !== null;

  return (
    <TableRow key={groupType}>
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
        <Stack direction="row" spacing={1}>
          {editing ? (
            <>
              <Autocomplete
                options={groupOptions}
                style={{ width: '18em' }}
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
                options={allRolesForGroup}
                multiple
                limitTags={1}
                style={{ width: '18em' }}
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
              <div style={{ display: 'absolute' }}>
                <IconButton
                  aria-label="add"
                  size="small"
                  color={isAddButtonEnabled ? 'success' : 'default'}
                  onClick={() => {
                    handleAddGroupRole();
                    if (!openGroupRoles.includes(groupType)) {
                      handleGroupRoleToggle(groupType);
                    }
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

export default GroupHeaderRow;
