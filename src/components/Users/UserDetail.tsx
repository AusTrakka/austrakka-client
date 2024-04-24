/* eslint-disable react/jsx-props-no-spreading */
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertColor, Autocomplete, Button, Paper, Snackbar, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { Cancel, Edit, Save } from '@mui/icons-material';
import { getOrgansations, getRoles, getUser, patchUserDetails } from '../../utilities/resourceUtils';
import { GroupRole, Role, UserDetails } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import RenderGroupedRolesAndGroups from './RoleSortingAndRender/RenderGroupedRolesAndGroups';
import renderIcon from '../Admin/UserIconRenderer';

interface EditButtonsProps {
  editing: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  onSave: () => void;
  onCancel: () => void;
  hasSavedChanges: boolean;
}

// Define the EditButtons component outside the UserDetail component
function EditButtons(props : EditButtonsProps) {
  const { editing,
    setEditing,
    onSave,
    hasSavedChanges,
    onCancel } = props;

  if (editing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
        <Button
          startIcon={<Save />}
          size="large"
          variant="contained"
          color="success"
          disabled={!hasSavedChanges}
          style={{ marginRight: '1rem' }}
          onClick={() => {
            setEditing(false);
            onSave(); // Call the onSave function when saving
          }}
        >
          Save
        </Button>
        <Button
          startIcon={<Cancel />}
          size="large"
          variant="contained"
          color="error"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    );
  }
  return (
    <Button
      startIcon={<Edit />}
      size="large"
      variant="contained"
      color="primary"
      onClick={() => setEditing(true)}
    >
      Edit
    </Button>
  );
}

function UserDetail() {
  const { userObjectId } = useParams();
  const { token, tokenLoading } = useApi();
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [editedValues, setEditedValues] = useState<UserDetails | null>(null);
  const [dataError, setDataError] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [openGroupRoles, setOpenGroupRoles] = useState<string[]>([]);
  const [updatedGroupRoles, setUpdatedGroupRoles] = useState<GroupRole[]>([]);
  const [patchMsg, setPatchMsg] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [patchSeverity, setPatchSeverity] = useState<string>('success');
  const [orgChanged, setOrgChanged] = useState<boolean>(false);

  const readableNames: Record<string, string> = {
    'displayName': 'Display Name',
    'orgName': 'Organisation',
    'orgAbbrev': 'Organisation Abbreviation',
    'created': 'Created Date',
    'contactEmail': 'Email',
    'isAusTrakkaAdmin': 'Austrakka Admin',
    'isActive': 'Active',
    'isAusTrakkaProcess': 'Austrakka Process',
  };

  const nonDisplayFields = [
    'orgAbbrev',
    'isAusTrakkaAdmin',
    'isAusTrakkaProcess',
  ];

  useEffect(() => {
    const updateUser = async () => {
      const userResponse: ResponseObject = await getUser(userObjectId!, token);

      if (userResponse.status === ResponseType.Success) {
        const userDto = userResponse.data as UserDetails;
        console.log('User:', userDto);
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
      const userResponse: ResponseObject = await getOrgansations(false, token);
      if (userResponse.status === ResponseType.Success) {
        const orgData = userResponse.data;
        console.log('Orgs:', orgData);
        setAllOrgs(orgData);
      } else {
        setErrMsg('Organisations could not be accessed');
        setDataError(true);
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS) {
      getOrgData();
    }
  }, [token, tokenLoading]);

  useEffect(() => {
    const getRolesData = async () => {
      const userResponse: ResponseObject = await getRoles(token);
      if (userResponse.status === ResponseType.Success) {
        const rolesData = userResponse.data as Role[];
        console.log('Roles:', rolesData);
        setAllRoles(rolesData);
      } else {
        setDataError(true);
        setErrMsg('Organisations could not be accessed');
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS) {
      getRolesData();
    }
  }, [token, tokenLoading]);

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

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSnackbar(false);
  };

  const renderEditableRow = (field: keyof UserDetails, detailValue: any) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setEditedValues((prevValues) => {
        if (prevValues === null) return null;
        return {
          ...prevValues,
          [field]: value,
        };
      });
    };

    switch (typeof detailValue) {
      case 'string':
        if (field === 'created') {
          return (
            <TableRow key={field}>
              <TableCell width="200em">{readableNames[field] || field}</TableCell>
              <TableCell>
                {isoDateLocalDate(detailValue)}
              </TableCell>
            </TableRow>
          );
        }
        if (field === 'orgName') {
          return (
            <TableRow key={field}>
              <TableCell width="200em">{readableNames[field] || field}</TableCell>
              <TableCell>
                <Autocomplete
                  options={allOrgs.map((org) => org.name)}
                  disableClearable
                  getOptionLabel={(option) => option.name ?? option}
                  value={editedValues?.orgName || null}
                  onChange={(event, newValue) => {
                    console.log('New Value:', newValue);
                    setOrgChanged(true);
                    setEditedValues((prevValues) => {
                      if (prevValues === null) return null;
                      return {
                        ...prevValues,
                        [field]: newValue,
                        'orgAbbrev': allOrgs.find((org) => org.name === newValue)?.abbreviation || prevValues.orgAbbrev,
                      };
                    });
                  }}
                  renderOption={(props, option) => (
                    <li {...props} style={{ fontSize: '0.9em' }}>
                      {option}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      hiddenLabel
                      variant="filled"
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
              </TableCell>
            </TableRow>
          );
        }
        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>
              <TextField
                value={editedValues?.[field] || ''}
                onChange={handleChange}
                variant="filled"
                fullWidth
                size="small"
                hiddenLabel
                inputProps={{ style: { padding: '5px 10px', fontSize: '.9rem' } }}
              />
            </TableCell>
          </TableRow>
        );
      case 'boolean':
        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>
              <Switch
                size="small"
                checked={editedValues?.[field] as boolean || false}
                onChange={handleChange}
              />
            </TableCell>
          </TableRow>
        );
      case 'object':
        if (detailValue === null) {
          return (
            <TableRow key={field}>
              <TableCell width="200em">{readableNames[field] || field}</TableCell>
              <TableCell>
                <TextField
                  value={editedValues?.[field] as string || ''}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              </TableCell>
            </TableRow>
          );
        }
        break;
      default:
        return (
          <TableRow key={field}>
            <TableCell width="200em">{readableNames[field] || field}</TableCell>
            <TableCell>{detailValue}</TableCell>
          </TableRow>
        );
    }
    return null;
  };

  const renderNonEditableRow = (field: keyof UserDetails, value: any) => (
    <TableRow key={field}>
      <TableCell width="200em">{readableNames[field] || field}</TableCell>
      <TableCell>
        {(() => {
          switch (true) {
            case field === 'created':
              return isoDateLocalDate(value);
            case typeof value === 'boolean':
              return <Switch disabled checked={value} size="small" />;
            default:
              return value;
          }
        })()}
      </TableCell>
    </TableRow>
  );

  const renderRow = (field: keyof UserDetails, value: any) => {
    if (editing) {
      return renderEditableRow(field, value);
    }
    return renderNonEditableRow(field, value);
  };

  const editUserDetails = async () => {
    const userResponse: ResponseObject = await patchUserDetails(userObjectId!, token, editedValues);
    if (userResponse.status === ResponseType.Success) {
      const userDto = userResponse.data as UserDetails;
      setUser(userDto);
      setEditedValues({ ...userDto });
      setUpdatedGroupRoles(userDto.groupRoles);
      setPatchMsg(userResponse.message);
      setPatchSeverity('success');
    } else {
      setPatchMsg('User could not be accessed');
      setPatchSeverity('error');
    }
    setOpenSnackbar(true);
  };

  const onSave = () => {
    if (editedValues === null) return;
    console.log('Saving changes:', editedValues);
    editUserDetails();
  };

  const handleCancel = () => {
    setEditing(false);
    setUpdatedGroupRoles(user!.groupRoles);
    setEditedValues({ ...user! });
    setOrgChanged(false);
  };

  const hasChanges =
  editedValues !== null &&
  user !== null &&
  Object.entries(editedValues).some(
    ([field, value]) => value !== user[field as keyof UserDetails],
  );

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
                return renderRow(field as keyof UserDetails, value);
              }
              if (field === 'groupRoles') {
                return (
                  <RenderGroupedRolesAndGroups
                    key={field}
                    user={user}
                    userGroupRoles={updatedGroupRoles} // Pass the updated group roles
                    openGroupRoles={openGroupRoles}
                    setOpenGroupRoles={setOpenGroupRoles}
                    editing={editing}
                    updateUserGroupRoles={updateUserGroupRoles}
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
    </div>
  ) : null;
}

export default UserDetail;
