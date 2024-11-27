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
  getOrganisations,
  getUserV2,
  patchUserV2,
} from '../../../utilities/resourceUtils';
import { useAppSelector } from '../../../app/store';
import { useApi } from '../../../app/ApiContext';
import { User, UserPatch } from '../../../types/dtos';
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

function UserDetailV2() {
  const { userGlobalId } = useParams();
  const { token, tokenLoading } = useApi();
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editedValues, setEditedValues] = useState<User | null>(null);
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
    defaultTenantGlobalId,
  } = useAppSelector(selectUserState);

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
    'orgId',
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
        const userDto = userResponse.data as User;
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

    if (token && tokenLoading === LoadingState.SUCCESS && editing) {
      getOrgData();
    }
  }, [token, tokenLoading, editing]);

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

  const renderRow = (field: keyof User, value: any) => {
    if (editing) {
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
    // TODO: groupRoles is temporary and will ne removed later
    const { groupRoles, ...otherValues } = editedValues as User;

    // Creating editedValuesDtoFormat object
    const editedValuesDtoFormat: UserPatch = {
      displayName: otherValues.displayName,
      contactEmail: otherValues.contactEmail,
      orgAbbrev: otherValues.orgAbbrev,
      isActive: otherValues.isActive, // disable a user through a general patch?
      analysisServerUsername: otherValues.analysisServerUsername,
    };

    try {
      // need to call patchUserV2 here
      const userResponseV2: ResponseObject = await patchUserV2(
        userGlobalId!,
        defaultTenantGlobalId,
        editedValuesDtoFormat,
        token,
      );

      if (userResponseV2.status !== ResponseType.Success) {
        throw new Error('User could not be accessed');
      }
      
      const userFetchResponse: ResponseObject = await getUserV2(
        userGlobalId!,
        defaultTenantGlobalId,
        token,
      );
      
      if (userFetchResponse.status !== ResponseType.Success) {
        throw new Error('User could not be accessed');
      }
      
      const userDto = userFetchResponse.data as User;

      setUser(userDto);
      setEditedValues({ ...userDto });
      setPatchMsg(userResponseV2.message);
      setPatchSeverity('success');
    } catch (error: any) {
      setPatchMsg(error.message);
      setPatchSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const onSave = () => {
    if (editedValues === null) return;
    editUserDetails();
    setOrgChanged(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedValues({ ...user! });
    setOrgChanged(false);
  };

  const hasChanges = !deepEqual(user, editedValues);

  return (user && !dataError) ? (
    <div>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        display="flex"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderIcon(user, 'large')}
          <Typography className="pageTitle" style={{ paddingBottom: 0 }}>
            {user.displayName}
          </Typography>
        </div>
    
      </Stack>
      <Grid
        container
        spacing={2}
        flex="flexwrap"
        width="100%"
        alignItems="stretch"
        columns={{ xs: 1, md: 1, lg: 1, xl: 1 }}
      >
        <Grid size="auto">
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
                editing={editing}
                setEditing={setEditing}
                onSave={onSave}
                onCancel={handleCancel}
                hasSavedChanges={hasChanges}
                canSee={canSee}
              />
            </Stack>
            {orgChanged ?
              <Alert style={{ marginTop: '15px' }} severity="warning">Changing the organisation will change the group roles</Alert>
              : null}
            {errMsg ? <Alert severity="error">{errMsg}</Alert> : null}
            <TableContainer
              component={Box}
            >
              <Table sx={{ borderBottom: 'none' }}>
                
                <TableBody>
                  {Object.entries(user).map(([field, value]) => {
                    if ((typeof value !== 'object' || value === null) && !nonDisplayFields.includes(field)) {
                      return renderRow(field as keyof User, value);
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid size="grow" minWidth="fit-content">
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
