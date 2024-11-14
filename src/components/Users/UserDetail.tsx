/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertColor, Paper, Snackbar, Stack, Table, TableBody, TableContainer, Typography } from '@mui/material';
import { deepEqual } from 'vega-lite';
import { getGroupList, getOrganisations, getRoles, getUser, putUser, replaceAssignments } from '../../utilities/resourceUtils';
import { Group, GroupRole, Role, User } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import RenderGroupedRolesAndGroups from './RoleSortingAndRender/RenderGroupedRolesAndGroups';
import renderIcon from '../Admin/UserIconRenderer';
import { useAppSelector } from '../../app/store';
import { selectUserState } from '../../app/userSlice';
import EditButtons from './EditButtons';
import EditableRow from './RowRender/EditableRow';
import BasicRow from './RowRender/BasicRow';

function UserDetail() {
  const { userObjectId } = useParams();
  const { token, tokenLoading } = useApi();
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editedValues, setEditedValues] = useState<User | null>(null);
  const [dataError, setDataError] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [openGroupRoles, setOpenGroupRoles] = useState<string[]>([]);
  const [updatedGroupRoles, setUpdatedGroupRoles] = useState<GroupRole[]>([]);
  const [patchMsg, setPatchMsg] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openDupSnackbar, setOpenDupSnackbar] = useState(false);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [patchSeverity, setPatchSeverity] = useState<string>('success');
  const [orgChanged, setOrgChanged] = useState<boolean>(false);
  const {
    loading,
    admin,
  } = useAppSelector(selectUserState);

  const readableNames: Record<string, string> = {
    'objectId': 'Object ID',
    'displayName': 'Display Name',
    'orgName': 'Organisation',
    'orgAbbrev': 'Organisation Abbreviation',
    'created': 'Created Date',
    'contactEmail': 'Email',
    'isAusTrakkaAdmin': 'Austrakka Admin',
    'isActive': 'Active',
    'isAusTrakkaProcess': 'Austrakka Process',
    'analysisServerUsername': 'Analysis Server Username',
  };

  let nonDisplayFields = [
    'objectId',
    'orgAbbrev',
    'orgId',
    'isAusTrakkaAdmin',
    'isAusTrakkaProcess',
  ];

  if (loading === LoadingState.SUCCESS && admin) {
    nonDisplayFields = nonDisplayFields.filter((field) => field !== 'objectId');
  }

  useEffect(() => {
    const updateUser = async () => {
      const userResponse: ResponseObject = await getUser(userObjectId!, token);

      if (userResponse.status === ResponseType.Success) {
        const userDto = userResponse.data as User;
        setUser(userDto);
        setEditedValues({ ...userDto });
        setUpdatedGroupRoles(userDto.groupRoles);
        // Initialize editedValues with the original user data
      } else {
        setErrMsg('User could not be accessed');
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS) {
      updateUser();
    }
  }, [userObjectId, token, tokenLoading]);

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

  useEffect(() => {
    const getAllGroups = async () => {
      const userResponse: ResponseObject = await getGroupList(token);
      if (userResponse.status === ResponseType.Success) {
        const groupData = userResponse.data as Group[];
        setAllGroups(groupData);
      } else {
        setDataError(true);
        setErrMsg('Organisations could not be accessed');
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS && editing) {
      getAllGroups();
    }
  }, [token, tokenLoading, editing]);

  useEffect(() => {
    const getRolesData = async () => {
      const userResponse: ResponseObject = await getRoles(token);
      if (userResponse.status === ResponseType.Success) {
        let rolesData = userResponse.data as Role[];
        rolesData = rolesData.filter((role) => role.name !== 'AusTrakkaAdmin');
        setAllRoles(rolesData);
      } else {
        setDataError(true);
        setErrMsg('Organisations could not be accessed');
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS && editing) {
      getRolesData();
    }
  }, [token, tokenLoading, editing]);

  const updateUserGroupRoles = (groupRoles: GroupRole[]) => {
    setUpdatedGroupRoles(groupRoles);
    setEditedValues((prevValues) => {
      if (prevValues === null) return null;
      return {
        ...prevValues,
        groupRoles,
      };
    });
  };

  const canSee = () => (loading === LoadingState.SUCCESS && admin);

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
    if (field === 'globalId') return null;
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
    const { groupRoles, ...otherValues } = editedValues as User;

    // Mapping groupRoles to the desired format
    const groupAssignmentsFormat = groupRoles.map((groupRole: GroupRole) => ({
      groupName: groupRole.group.name,
      roleName: groupRole.role.name,
    }));

    // Creating editedValuesDtoFormat object
    const editedValuesDtoFormat = {
      displayName: otherValues.displayName,
      contactEmail: otherValues.contactEmail,
      orgAbbrev: otherValues.orgAbbrev,
      isActive: otherValues.isActive,
      analysisServerUsername: otherValues.analysisServerUsername,
    };

    try {
      // Updating user details
      // Replacing group assignments
      const assignmentResponse: ResponseObject = await replaceAssignments(
        userObjectId!,
        token,
        groupAssignmentsFormat,
      );

      if (assignmentResponse.status !== ResponseType.Success) {
        throw new Error('Could not assign group roles');
      }

      const userResponse: ResponseObject = await putUser(
        userObjectId!,
        token,
        editedValuesDtoFormat,
      );

      if (userResponse.status !== ResponseType.Success) {
        throw new Error('User could not be accessed');
      }

      // Updating local state with the new user data
      const userDto = userResponse.data as User;
      setUser(userDto);
      setEditedValues({ ...userDto });
      setUpdatedGroupRoles(userDto.groupRoles);
      setPatchMsg(userResponse.message);
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
    setUpdatedGroupRoles(user!.groupRoles);
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
        <EditButtons
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
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableBody>
            {Object.entries(user).map(([field, value]) => {
              if ((typeof value !== 'object' || value === null) && !nonDisplayFields.includes(field)) {
                return renderRow(field as keyof User, value);
              }
              if (field === 'groupRoles') {
                return (
                  <RenderGroupedRolesAndGroups
                    key={field}
                    user={user}
                    setOpenDupSnackbar={setOpenDupSnackbar}
                    userGroupRoles={updatedGroupRoles} // Pass the updated group roles
                    openGroupRoles={openGroupRoles}
                    setOpenGroupRoles={setOpenGroupRoles}
                    editing={editing}
                    updateUserGroupRoles={updateUserGroupRoles}
                    allGroups={allGroups}
                    allRoles={allRoles}
                  />
                );
              }
              return null;
            })}
          </TableBody>
        </Table>
      </TableContainer>
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

export default UserDetail;
