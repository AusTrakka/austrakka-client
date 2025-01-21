/* eslint-disable react/jsx-props-no-spreading,@typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AlertColor, Box,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { deepEqual } from 'vega-lite';
import {
  disableUserV2, enableUserV2,
  getOrganisations,
  getUserV2, patchUserOrganisationV2,
  patchUserV2,
} from '../../../utilities/resourceUtils';
import { useAppSelector } from '../../../app/store';
import { useApi } from '../../../app/ApiContext';
import { User, UserPatch, UserPatchV2, UserV2 } from '../../../types/dtos';
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

function UserDetailV2() {
  const { userGlobalId } = useParams();
  const { token, tokenLoading } = useApi();
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPrivileges, setEditingPrivileges] = useState(false);
  const [user, setUser] = useState<UserV2 | null>(null);
  const [editedValues, setEditedValues] = useState<UserV2 | null>(null);
  const [onSaveLoading, setOnSaveLoading] = useState<boolean>(false);
  const [editedPrivileges, setEditedPrivileges] = useState<any | null>(null);
  const [updatedPrivileges, setUpdatedPrivileges] = useState<any | null>(null);
  const [dataError, setDataError] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [patchMsg, setPatchMsg] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openGroupRoles, setOpenGroupRoles] = useState<string[]>([]);
  const [openDupSnackbar, setOpenDupSnackbar] = useState(false);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [patchSeverity, setPatchSeverity] = useState<string>('success');
  const [orgChanged, setOrgChanged] = useState<boolean>(false);
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
        setEditedValues({ ...userDto });
        // setUpdatedGroupRoles(userDto.groupRoles);
        // Initialize editedValues with the original user data
      } else {
        setErrMsg('User could not be accessed');
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS &&
        loading === LoadingState.SUCCESS &&
        userGlobalId && defaultTenantGlobalId) {
      updateUser();
    }
  }, [userGlobalId, defaultTenantGlobalId, token, tokenLoading, loading]);

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
  
  const onPrivSave = () => {
   
  };

  const handleCancel = () => {
    setEditingBasic(false);
    setEditedValues({ ...user! });
    setOrgChanged(false);
  };
  
  const handlePrivCancel = () => {
    setEditingPrivileges(false);
    setEditedPrivileges(user?.privileges);
  };

  const hasChanges = !deepEqual(user, editedValues);
  const privHasChanges = !deepEqual(user?.privileges!, editedPrivileges);

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
                    userGroupedPrivileges={user.privileges}
                    openGroupRoles={openGroupRoles}
                    setOpenGroupRoles={setOpenGroupRoles}
                    editing={editingPrivileges}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
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
