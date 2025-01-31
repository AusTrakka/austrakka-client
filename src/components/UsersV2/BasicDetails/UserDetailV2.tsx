/* eslint-disable react/jsx-props-no-spreading,@typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AlertColor, Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent, DialogTitle,
  List,
  ListItem, ListItemIcon, ListItemText,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { deepEqual } from 'vega-lite';
import { CheckCircle, RemoveCircle, Save } from '@mui/icons-material';
import {
  disableUserV2, enableUserV2,
  getOrganisations,
  getUserV2, patchUserOrganisationV2,
  patchUserV2,
} from '../../../utilities/resourceUtils';
import { useAppSelector } from '../../../app/store';
import { useApi } from '../../../app/ApiContext';
import {
  GroupedPrivilegesByRecordType, PrivilegeWithRoles,
  UserPatchV2,
  UserV2,
} from '../../../types/dtos';
import { selectUserState } from '../../../app/userSlice';
import LoadingState from '../../../constants/loadingState';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';
import BasicRow from '../RowRender/BasicRow';
import EditableRow from '../RowRender/EditableRow';
import renderIcon from '../../Admin/UserIconRenderer';
import EditButtonsV2 from '../EditButtonsV2';
import '../RowRender/RowAndCell.css';
import RenderGroupedPrivileges from '../RoleSortingAndRender/RenderGroupedPrivileges';
import { selectTenantState } from '../../../app/tenantSlice';
import { PendingChanges, RoleAssignments } from '../../../types/userDetailEdit.interface';
  
function UserDetailV2() {
  const { userGlobalId } = useParams();
  const { token, tokenLoading } = useApi();
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPrivileges, setEditingPrivileges] = useState(false);
  const [user, setUser] = useState<UserV2 | null>(null);
  const [editedValues, setEditedValues] = useState<UserV2 | null>(null);
  const [onSaveLoading, setOnSaveLoading] = useState<boolean>(false);
  const [editedPrivileges, setEditedPrivileges] =
      useState<GroupedPrivilegesByRecordType[] | null>(null);
  const [dataError, setDataError] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [patchMsg, setPatchMsg] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openGroupRoles, setOpenGroupRoles] = useState<string[]>([]);
  const [openDupSnackbar, setOpenDupSnackbar] = useState(false);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [patchSeverity, setPatchSeverity] = useState<string>('success');
  const [orgChanged, setOrgChanged] = useState<boolean>(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges[]>([]);
  const {
    loading,
    adminV2,
  } = useAppSelector(selectUserState);
  const { defaultTenantGlobalId } = useAppSelector(selectTenantState);

  const readableNames: Record<string, string> = {
    'objectId': 'Object ID',
    'globalId': 'Global ID',
    'displayName': 'Display Name',
    'orgName': 'Organisation',
    'orgAbbrev': 'Organisation Abbreviation',
    'created': 'Created Date',
    'contactEmail': 'Email',
    'isAusTrakkaAdmin': 'Austrakka Admin',
    'isActive': 'Active',
    'isAusTrakkaProcess': 'Austrakka Process',
    'analysisServerUsername': 'Linux Username',
  };

  let nonDisplayFields = [
    'objectId',
    'orgAbbrev',
    'orgGlobalId',
    'isAusTrakkaAdmin',
    'isAusTrakkaProcess',
  ];
  if (loading === LoadingState.SUCCESS && adminV2) {
    // maybe there should also be a check for the appropriate scopes for the user such as 
    // method=patch, path=/v2/users/.. etc.
    // for now only the superuser role will be allowed to edit the user. However, it should
    // be the AusTrakkaAdmin role. This does not exist yet...
    nonDisplayFields = nonDisplayFields.filter((field) => field !== 'objectId');
  }

  useEffect(() => {
    const updateUser = async () => {
      const userResponse: ResponseObject = await getUserV2(
        userGlobalId!,
        defaultTenantGlobalId!,
        token,
      );

      if (userResponse.status === ResponseType.Success) {
        const userDto = userResponse.data as UserV2;
        setUser(userDto);
        setEditedPrivileges(userDto.privileges ?? []);
        setEditedValues({ ...userDto });
        // setUpdatedGroupRoles(userDto.groupRoles);
        // Initialize editedValues with the original user data
      } else {
        setErrMsg('User could not be accessed');
      }
    };

    if (tokenLoading !== LoadingState.IDLE &&
        tokenLoading !== LoadingState.LOADING &&
        loading === LoadingState.SUCCESS &&
        userGlobalId && defaultTenantGlobalId) {
      updateUser();
    }
  }, [defaultTenantGlobalId, loading, token, tokenLoading, userGlobalId]);
  
  useEffect(() => {
    const getOrgData = async () => {
      const userResponse: ResponseObject = await getOrganisations(false, token);
      if (userResponse.status === ResponseType.Success) {
        const orgData = userResponse.data;
        setAllOrgs(orgData);
      } else {
        setErrMsg('Organisations could not be accessed');
        setDataError(true);
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS && editingBasic) {
      getOrgData();
    }
  }, [token, tokenLoading, editingBasic]);

  const canSee = () => (loading === LoadingState.SUCCESS && adminV2);

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSnackbar(false);
  };

  const handleDupClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenDupSnackbar(false);
  };
  
  const handleConfirmPrivileges = () => {
    setPendingChanges([]);
    setEditedPrivileges(JSON.parse(JSON.stringify(user?.privileges)));
    setEditingPrivileges(false);
    setShowConfirmationDialog(false);
  };
  
  const renderRow = (field: keyof UserV2, value: any) => {
    if (editingBasic) {
      return (
        <EditableRow
          key={field}
          field={field}
          detailValue={value}
          editedValues={editedValues}
          setEditedValues={setEditedValues}
          readableNames={readableNames}
          allOrgs={allOrgs}
          setOrgChanged={setOrgChanged}
        />
      );
    }
    return (
      <BasicRow
        key={field}
        field={field}
        value={value}
        readableNames={readableNames}
      />
    );
  };

  const editUserDetails = async () => {
    // I need to ignore the groupRoles field for this version of the page
    const { orgGlobalId, isActive, ...otherValues } = editedValues as UserV2;

    // Creating editedValuesDtoFormat object
    const editedValuesDtoFormat: UserPatchV2 = {
      displayName: otherValues.displayName,
      contactEmail: otherValues.contactEmail,
      analysisServerUsername: otherValues.analysisServerUsername,
    };
    
    const editedActiveState = user?.isActive !== isActive;
    const editedOrganisation = user?.orgGlobalId !== orgGlobalId;
    try {
      // basic patch
      const userResponse: ResponseObject = await patchUserV2(
        userGlobalId!,
        editedValuesDtoFormat,
        defaultTenantGlobalId,
        token,
      );
      
      // enable user
      if (editedActiveState) {
        let userActivateResponse: ResponseObject;
        if (isActive) {
          userActivateResponse = await enableUserV2(
            userGlobalId!,
            defaultTenantGlobalId,
            token,
          );
        } else {
          userActivateResponse = await disableUserV2(
            userGlobalId!,
            defaultTenantGlobalId,
            token,
          );
        }
        if (userActivateResponse.status !== ResponseType.Success) {
          throw new Error('User could not be activated/deactivated');
        }
      }
      
      // patch organisation
      if (editedOrganisation) {
        const patchUserOrganisationResponse: ResponseObject = await patchUserOrganisationV2(
          userGlobalId!,
          user!.orgGlobalId,
          orgGlobalId,
          defaultTenantGlobalId,
          token,
        );
        if (patchUserOrganisationResponse.status !== ResponseType.Success) {
          throw new Error('User organisation could not be accessed/changed');
        }
      }

      if (userResponse.status !== ResponseType.Success) {
        throw new Error('User could not be accessed/changed');
      }
      
      const userFetchResponse: ResponseObject = await getUserV2(
        userGlobalId!,
        defaultTenantGlobalId,
        token,
      );
      
      if (userFetchResponse.status !== ResponseType.Success) {
        throw new Error('User could not be accessed');
      }
      
      const userDto = userFetchResponse.data as UserV2;
      
      setPatchMsg(userResponse.message);
      setPatchSeverity('success');
      setUser(userDto);
      setEditedValues({ ...userDto });
    } catch (error: any) {
      setPatchMsg(error.message);
      setPatchSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const onSave = async () => {
    if (editedValues === null) return;
    setOnSaveLoading(true);
    await editUserDetails();
    setOrgChanged(false);
    setOnSaveLoading(false);
    setEditingBasic(false);
  };

  const onSelectionChange = (
    recordType: string,
    AssignedRoles: RoleAssignments[],
  ) => {
    // Update the editedPrivileges state for UI rendering
    setEditedPrivileges(prev => {
      const safePrev = prev ?? [];
      const existingPrivileges = new Map(
        safePrev.map(priv => [priv.recordType, priv]),
      );

      const newRecordRoles: PrivilegeWithRoles[] = AssignedRoles.map(assigned => ({
        recordName: assigned.record.abbrev,
        roleNames: assigned.roles.map(role => role.name),
      }));

      // If recordType exists, merge roles; otherwise add new entry
      return existingPrivileges.has(recordType)
        ? safePrev.map(priv => {
          if (priv.recordType === recordType) {
            // Find existing roles for each record
            const existingRolesByRecord = new Map(
              priv.recordRoles.map(record => [record.recordName, record]),
            );

            // Merge or add new roles for each record
            newRecordRoles.forEach(newRecord => {
              const existing = existingRolesByRecord.get(newRecord.recordName);
              if (existing) {
                // Merge roles, removing duplicates
                existing.roleNames = [...new Set([...existing.roleNames, ...newRecord.roleNames])];
              } else {
                // Add new record
                priv.recordRoles.push(newRecord);
              }
            });

            return priv;
          }
          return priv;
        })
        : [...safePrev, { recordType, recordRoles: newRecordRoles }];
    });

    // Generate payload for additions only
    const payloadBuilder: PendingChanges[] = AssignedRoles.flatMap(assignedRole =>
      assignedRole.roles.map(role => ({
        type: 'POST',
        recordType,
        payload: {
          recordGlobalId: assignedRole.record.id,
          roleGlobalId: role.globalId,
          recordName: assignedRole.record.name,
          roleName: role.name,
        },
      })));

    setPendingChanges(payloadBuilder);
  };

  const handleCloseDialog = () => {
    setShowConfirmationDialog(false);
  };

  // Modified onPrivSave
  const onPrivSave = () => {
    if (pendingChanges.length > 0) {
      setShowConfirmationDialog(true);
    }
  };

  const handleCancel = () => {
    setEditingBasic(false);
    setEditedValues({ ...user! });
    setOrgChanged(false);
  };
  
  const handlePrivCancel = () => {
    setEditingPrivileges(false);
    setEditedPrivileges(JSON.parse(JSON.stringify(user?.privileges)));
    setPendingChanges([]);
  };

  const hasChanges = !deepEqual(user, editedValues);
  const privHasChanges = pendingChanges.length > 0;
  
  return (user && !dataError) ? (
    <div>
      <Stack
        direction="column"
        justifyContent="space-between"
      >
        <div style={{ display: 'flex' }}>
          {renderIcon(user, 'large')}
          <Typography className="pageTitle" style={{ paddingBottom: 0 }}>
            {user.displayName}
          </Typography>
        </div>
        {orgChanged ? (
          <Alert style={{ marginTop: '15px' }} severity="warning">
            Changing a user&apos;s organization is a significant action
            and should be approached with caution. Proceed carefully.
          </Alert>
        )
          : null}
      </Stack>
      <Grid
        container
        spacing={4}
        flex="flexwrap"
        width="100%"
        alignItems="stretch"
      >
        <Grid size={{ xs: 12, md: 12, lg: 12, xl: 4.5 }}>
          <Paper elevation={1} className="basic-info-table">
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              display="flex"
              style={{ padding: '10px' }}
            >
              <Typography variant="h4" color="primary">
                User Details
              </Typography>
              <EditButtonsV2
                editing={editingBasic}
                setEditing={setEditingBasic}
                onSave={onSave}
                onCancel={handleCancel}
                hasSavedChanges={hasChanges}
                canSee={canSee}
                onSaveLoading={onSaveLoading}
              />
            </Stack>
            {errMsg ? <Alert severity="error">{errMsg}</Alert> : null}
            <TableContainer
              component={Box}
            >
              <Table sx={{ borderBottom: 'none' }}>
                <TableBody>
                  {Object.entries(user).map(([field, value]) => {
                    if ((typeof value !== 'object' || value === null) && !nonDisplayFields.includes(field)) {
                      return renderRow(field as keyof UserV2, value);
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 12, xl: 7.5 }}>
          <Paper elevation={1} className="basic-info-table">
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              display="flex"
              style={{ padding: '10px' }}
            >
              <Typography variant="h4" color="primary">
                Privileges
              </Typography>
              <EditButtonsV2
                editing={editingPrivileges}
                setEditing={setEditingPrivileges}
                onSave={onPrivSave}
                onCancel={handlePrivCancel}
                hasSavedChanges={privHasChanges}
                canSee={canSee}
                onSaveLoading={onSaveLoading}
              />
            </Stack>
            <TableContainer
              component={Box}
              sx={{ borderRadius: '6px' }}
            >
              <Table>
                <TableBody>
                  <RenderGroupedPrivileges
                    userGroupedPrivileges={editedPrivileges ?? user.privileges}
                    openGroupRoles={openGroupRoles}
                    setOpenGroupRoles={setOpenGroupRoles}
                    editing={editingPrivileges}
                    onSelectionChange={onSelectionChange}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      <Dialog
        open={showConfirmationDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Confirm Privilege Changes</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to make the following changes:
          </Typography>
          <List dense>
            {pendingChanges.map((change) => (
              <ListItem key={change.payload.recordGlobalId + change.payload.roleGlobalId}>
                <ListItemIcon>
                  {change.type === 'POST' ? <CheckCircle color="success" /> : <RemoveCircle color="error" />}
                </ListItemIcon>
                <ListItemText
                  primary={`${change.type === 'POST' ? 'ADD' : 'REMOVE'} ${change.recordType}`}
                  secondary={`Record: ${change.payload.recordName}, Role: ${change.payload.roleName}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmPrivileges}
            variant="contained"
            color="primary"
            startIcon={<Save />}
          >
            Confirm Changes
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={patchSeverity as AlertColor}>
          {patchMsg}
        </Alert>
      </Snackbar>
      <Snackbar
        open={openDupSnackbar}
        autoHideDuration={4000}
        onClose={handleDupClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleDupClose} severity="error">
          Group Role already exists
        </Alert>
      </Snackbar>
    </div>
  ) : null;
}

export default UserDetailV2;
