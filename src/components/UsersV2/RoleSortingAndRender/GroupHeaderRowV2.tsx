/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import {
  AddCircle,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { getOrganisations } from '../../../utilities/resourceUtils';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';
import { useApi } from '../../../app/ApiContext';
import LoadingState from '../../../constants/loadingState';
import './autocompleteStyleOverride.css';
import { RolesV2 } from '../../../types/dtos';
import { MinifiedRecord, RoleAssignments } from '../../../types/userDetailEdit.interface';
import { RecordAutocomplete } from './RecordAutocomplete';
import { RoleAutocomplete } from './RoleAutocomplete';
import { Theme } from '../../../assets/themes/theme';

interface GroupHeaderRowProps {
  recordType: string;
  openGroupRoles: string[];
  handleGroupRoleToggle: (groupName: string) => void;
  editing: boolean;
  rolesErrorMessage: string | null;
  roles: RolesV2[];
  empty: boolean;
  onSelectionChange: (
    recordType: string,
    assignments: RoleAssignments[],
  ) => void;
}

function GroupHeaderRowV2(props: GroupHeaderRowProps) {
  const {
    recordType,
    empty,
    openGroupRoles,
    handleGroupRoleToggle,
    editing,
    roles,
    rolesErrorMessage,
    onSelectionChange,
  } = props;
  
  const [selectedRoles, setSelectedRoles] = useState<RolesV2[] | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<MinifiedRecord[] | null>(null);
  const [records, setRecords] = useState<MinifiedRecord[] | null>(null);
  const [recordFetchError, setRecordFetchError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();

  const isAddButtonEnabled = selectedRecords !== null && selectedRoles !== null;
  const tenantName = 'Default Tenant';

  useEffect(() => {
    async function fetchRecords() {
      try {
        let response: ResponseObject | null = null;
        switch (recordType) {
          case 'Organisation':
            response = await getOrganisations(false, token);
            break;
          default:
            // TODO: Will need to add more calls once endpoints have been added
            // I think project is technically there but I dont think roles can be added for it.
            // for the cli
            return;
        }

        if (response.status !== ResponseType.Success) {
          setRecordFetchError(response.message);
          return;
        }
        
        const rolesV2: any[] = response.data;

        setRecords(rolesV2.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))
          .map((item: any) => ({
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
        const tenantDefaultRecord = {
          id: '', // No required for tenant
          abbrev: tenantName,
          name: tenantName,
        };
        setSelectedRecords([tenantDefaultRecord]);
        setRecords([tenantDefaultRecord]);
      }
    }
  }, [recordType, token, tokenLoading]);

  useEffect(() => {
    if (rolesErrorMessage || recordFetchError) {
      setFetchError(rolesErrorMessage || recordFetchError);
    }
  }, [rolesErrorMessage, recordFetchError]);
  
  useEffect(() => {
    if (!editing) {
      if (recordType !== 'Tenant') {
        setSelectedRoles(null);
        setSelectedRecords(null);
      } else {
        setSelectedRoles(null);
      }
    }
  }, [editing, recordType]);
    
  const handleAddPrivilege = () => {
    if (selectedRecords && selectedRoles) {
      const assignedRoles: RoleAssignments[] = [];

      for (const record of selectedRecords) {
        const existingAssignment =
            assignedRoles.find((assignment) => assignment.record.id === record.id);

        if (existingAssignment) {
          existingAssignment.roles.push(...selectedRoles.filter(
            (role) => !existingAssignment.roles.some((r) => r.globalId === role.globalId),
          ));
        } else {
          assignedRoles.push({
            record,
            roles: [...selectedRoles],
          });
        }
      }
      onSelectionChange(recordType, assignedRoles);
      setSelectedRoles(null);
      if (recordType !== 'Tenant') {
        setSelectedRecords(null);
      }
    }
  };

  return (
    <TableRow
      key={recordType}
      style={{
        backgroundColor: Theme.PrimaryGrey,
        borderRadius: '6px',
        border: 'none',
      }}
    >
      <TableCell width="250em">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            disabled={empty}
            aria-label="expand row"
            size="small"
            disableRipple
            onClick={() => handleGroupRoleToggle(recordType)}
          >
            <KeyboardArrowRight
              sx={{ 'transform': openGroupRoles.includes(recordType) ?
                'rotate(90deg)' : 'rotate(0deg)',
              'transition': 'transform 0.125s ease-in-out' }}
            />
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
              {editing && records ? (
                <>
                  <RecordAutocomplete
                    records={records}
                    selectedRecords={selectedRecords}
                    setSelectedRecords={setSelectedRecords}
                    recordType={recordType}
                  />
                  <RoleAutocomplete
                    roles={roles}
                    selectedRoles={selectedRoles}
                    setSelectedRoles={setSelectedRoles}
                  />
                  <div style={{ display: 'flex' }}>
                    <IconButton
                      aria-label="add"
                      size="small"
                      color={isAddButtonEnabled ? 'success' : 'default'}
                      onClick={() => {
                        handleAddPrivilege();
                        if (!openGroupRoles.includes(recordType)) {
                          handleGroupRoleToggle(recordType);
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
          )}
      </TableCell>
    </TableRow>
  );
}

export default GroupHeaderRowV2;
