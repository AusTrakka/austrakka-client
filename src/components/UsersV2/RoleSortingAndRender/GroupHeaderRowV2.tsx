/* eslint-disable react/jsx-props-no-spreading */

// TODO: come back to this, as this page cannot be accessed at the moment
// This is the V2 version of adding roles to a record/group
import React, { useEffect, useState } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Stack,
  Autocomplete,
  Checkbox, TextField, Chip, Tooltip, Alert,
} from '@mui/material';
import {
  AddCircle,
  CheckBox,
  CheckBoxOutlineBlank,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { selectTenantState, TenantSliceState } from '../../../app/tenantSlice';
import { useAppSelector } from '../../../app/store';
import { getOrganisations, getProjectList } from '../../../utilities/resourceUtils';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';
import { useApi } from '../../../app/ApiContext';
import LoadingState from '../../../constants/loadingState';
import './autocompleteStyleOverride.css';
import { RolesV2 } from '../../../types/dtos';

interface GroupHeaderRowProps {
  recordType: string;
  openGroupRoles: string[];
  handleGroupRoleToggle: (groupName: string) => void;
  editing: boolean;
  rolesErrorMessage: string | null;
  roles: RolesV2[];
}

function GroupHeaderRowV2(props: GroupHeaderRowProps) {
  const {
    recordType,
    openGroupRoles,
    handleGroupRoleToggle,
    editing,
    roles,
    rolesErrorMessage,
  } = props;
 
  interface MinifiedRecord {
    id: string;
    name: string;
    abbrev: string;
  }
  
  const tenant: TenantSliceState = useAppSelector(selectTenantState);
  const [selectedRoles, setSelectedRoles] = useState<any[] | null>(null);
  const [selectedResources, setSelectedResources] = useState<MinifiedRecord[] | null>(null);
  const [resources, setResources] = useState<MinifiedRecord[] | null>(null);
  const [recordFetchError, setRecordFetchError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();

  // need to fetch roles for said resource type
  // will use temp list for now
  
  const isAddButtonEnabled = selectedResources !== null && selectedRoles !== null;

  useEffect(() => {
    async function fetchRecords() {
      try {
        let response: ResponseObject | null = null;

        switch (recordType) {
          case 'Project':
            response = await getProjectList(token);
            break;
          case 'Organisation':
            response = await getOrganisations(false, token);
            break;
          default:
            return;
        }

        if (response.status !== ResponseType.Success) {
          setRecordFetchError(response.message);
          return;
        }

        setResources(response.data.map((item: any) => ({
          id: item.globalId,
          abbrev: item.abbreviation,
          name: item.name,
        })));
      } catch (error) {
        setRecordFetchError('An error occurred while fetching records.');
      }
    }

    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      if (recordType !== 'Tenant') {
        fetchRecords();
      } else {
        setResources(null);
        setSelectedResources([{
          id: tenant.defaultTenantGlobalId,
          abbrev: tenant.defaultTenantName,
          name: tenant.defaultTenantName,
        }]);
      }
    }
  }, [recordType, tenant, token, tokenLoading]);

  useEffect(() => {
    if (rolesErrorMessage || recordFetchError) {
      setFetchError(rolesErrorMessage || recordFetchError);
    }
  }, [rolesErrorMessage, recordFetchError]);

  return (
    <TableRow
      key={recordType}
      style={{
        backgroundColor: 'var(--primary-grey)',
        borderRadius: '6px',
        border: 'none',
      }}
    >
      <TableCell width="250em">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => handleGroupRoleToggle(recordType)}
          >
            {openGroupRoles.includes(recordType) ? <KeyboardArrowDown /> :
            <KeyboardArrowRight />}
          </IconButton>
          <Typography variant="body2">{recordType}</Typography>
        </div>
      </TableCell>
      <TableCell>
        { fetchError && editing ? (
          <Alert severity="error" variant="standard">
            {rolesErrorMessage}
          </Alert>
        ) :
          (
            <Stack direction="row" spacing={1}>
              {editing ? (
                <>
                  <Autocomplete
                    options={resources || []}
                    multiple
                    disabled={recordType === 'Tenant'}
                    limitTags={1}
                    style={{ width: '19em' }}
                    value={selectedResources || []}
                    disableCloseOnSelect
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.name}
                    onChange={(e, v) => setSelectedResources(v)}
                    renderOption={(_props, option, { selected }) => (
                      <li {..._props} style={{ fontSize: '0.9em' }} key={option.id}>
                        <Checkbox
                          style={{ marginRight: '8px' }}
                          checked={selected}
                          icon={<CheckBoxOutlineBlank />}
                          checkedIcon={<CheckBox />}
                        />
                        {option.name}
                      </li>
                    )}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        const { key, ...propsButKeyRemoved } = tagProps;
                        return (
                          <Tooltip title={option.name} key={key}>
                            <Chip
                              label={option.name}
                              {...propsButKeyRemoved}
                              style={{
                                maxWidth: '11em', // Limit chip width
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        hiddenLabel
                        placeholder={selectedResources?.length ? '' : 'Select Group'}
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
                    options={roles || []}
                    multiple
                    limitTags={1}
                    style={{ width: '19em' }}
                    value={selectedRoles || []}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.roleId === value.roleId}
                    onChange={(e, v) => setSelectedRoles(v)}
                    renderOption={(_props, option, { selected }) => (
                      <li {..._props} style={{ fontSize: '0.9em' }} key={option.roleId}>
                        <Checkbox
                          style={{ marginRight: '8px' }}
                          checked={selected}
                          icon={<CheckBoxOutlineBlank />}
                          checkedIcon={<CheckBox />}
                        />
                        {option.name}
                      </li>
                    )}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        const { key, ...propsButKeyRemoved } = tagProps;
                        return (
                          <Tooltip title={option.name} key={key}>
                            <Chip
                              label={option.name}
                              {...propsButKeyRemoved}
                              style={{
                                maxWidth: '11em', // Limit chip width
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        hiddenLabel
                        variant="filled"
                        placeholder={selectedRoles?.length ? '' : 'Select Role'}
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
          )}
      </TableCell>
    </TableRow>
  );
}

export default GroupHeaderRowV2;
