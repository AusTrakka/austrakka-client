import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AlertColor,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { deepEqual } from 'vega-lite';
import {
  disableUserV2,
  enableUserV2,
  getUserV2,
  patchUserV2,
} from '../../../utilities/resourceUtils';
import { useAppSelector } from '../../../app/store';
import { useApi } from '../../../app/ApiContext';
import {
  GroupedPrivilegesByRecordType, RecordRole,
  UserPatchV2,
  UserV2,
} from '../../../types/dtos';
import { selectUserState } from '../../../app/userSlice';
import LoadingState from '../../../constants/loadingState';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';
import renderIcon from '../../Admin/UserIconRenderer';
import '../RowRender/RowAndCell.css';
import { selectTenantState } from '../../../app/tenantSlice';
import { PendingChange, RoleAssignments } from '../../../types/userDetailEdit.interface';
import { ChangesDialog } from './ChangesDialog';
import { FailedChangesDialog } from './FailedChangesDialog';
import UserProperties from './UserProperties';
import UserPrivileges from './UserPrivileges';
import {
  checkEditUserScopes,
  checkFetchUserScope,
  filterAssignedRoles, removeSelectionFromPrivileges,
  updateEditedPrivileges, updatePendingChanges, updatePendingChangesForRemoval,
} from '../../../utilities/privilegeUtils';
import { processPrivilegeChanges } from '../../Users/privilegeBulkApiCall';
import { isoDateOrNotRecorded } from '../../../utilities/dateUtils';
import { bytesToMB } from '../../../utilities/renderUtils';
  
function UserV2DetailOverview() {
  const { userGlobalId } = useParams();
  const { token, tokenLoading } = useApi();
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPrivileges, setEditingPrivileges] = useState(false);
  const [user, setUser] = useState<UserV2 | null>(null);
  const [editedValues, setEditedValues] = useState<UserV2 | null>(null);
  const [onSaveLoading, setOnSaveLoading] = useState<boolean>(false);
  const [editedPrivileges, setEditedPrivileges] =
      useState<GroupedPrivilegesByRecordType[] | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [patchMsg, setPatchMsg] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openGroupRoles, setOpenGroupRoles] = useState<string[]>([]);
  const [openDupSnackbar, setOpenDupSnackbar] = useState(false);
  const [patchSeverity, setPatchSeverity] = useState<string>('success');
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [failedChanges, setFailedChanges] = useState<[string | null, PendingChange][]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [failedChangesDialogOpen, setFailedChangesDialogOpen] = useState(false);
  const [openSuccessPrivAssignmentSnackbar, setOpenSuccessPrivAssignmentSnackbar] = useState(false);
  const {
    loading,
    adminV2,
    scopes,
  } = useAppSelector(selectUserState);
  const { defaultTenantGlobalId } = useAppSelector(selectTenantState);

  const readableNames: Record<string, string> = {
    'objectId': 'Object ID',
    'globalId': 'Global ID',
    'position': 'Position',
    'displayName': 'Name',
    'analysisServerUsername': 'Linux Username',
    'orgName': 'Organisation',
    'contactEmail': 'Email',
    'isActive': 'Active',
    'noDownloadQuota': 'No Download Quota',
    'monthlyBytesQuota': 'Download Quota',
    'created': 'Joined',
  };

  // 'monthlyBytesUsed': 'Monthly Bytes Used',
  //     'monthlyBytesQuota': 'Monthly Bytes Quota',
  let nonDisplayFields = [
    'objectId',
    'orgAbbrev',
    'orgGlobalId',
    'lastLogIn',
    'lastActive',
    'isAusTrakkaAdmin',
    'isAusTrakkaProcess',
    'monthlyBytesUsed',
  ];

  if (user && user.noDownloadQuota) {
    nonDisplayFields.push('monthlyBytesQuota');
  }
  
  // Add a boolean constant to determine if the user can see this page.
  // Currently, access is only granted to adminV2 (the root super user).
  // Instead, the visibility and editability of the page should be checked separately
  // based on the required scopes.
  
  const canFetch = checkFetchUserScope(scopes);
  const canEdit = checkEditUserScopes(scopes);
  
  // this should check if it has loaded then if its super user and
  // lastly if they have the scope for fetching the user
  if (loading === LoadingState.SUCCESS && (adminV2 || canFetch)) {
    nonDisplayFields = nonDisplayFields.filter((field) => field !== 'objectId');
  }

  const handleCloseDialog = () => {
    setShowConfirmationDialog(false);
  };

  const onPrivSave = () => {
    if (pendingChanges.length > 0) {
      setShowConfirmationDialog(true);
    }
  };

  const handleCancel = () => {
    setEditingBasic(false);
    setEditedValues(JSON.parse(JSON.stringify(user!)));
  };

  const handlePrivCancel = () => {
    setEditedPrivileges(JSON.parse(JSON.stringify(user?.privileges)));
    setPendingChanges([]);
    setEditingPrivileges(false);
  };

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

  const handleSuccessPrivAssignmentSnackbarClose = (
    event: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSuccessPrivAssignmentSnackbar(false);
  };

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
        setEditedPrivileges(JSON.parse(JSON.stringify(userDto.privileges)));
        setEditedValues({ ...userDto });
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
  
  async function fetchUserDto(): Promise<UserV2> {
    const userFetchResponse: ResponseObject = await getUserV2(
      userGlobalId!,
      defaultTenantGlobalId,
      token,
    );

    if (userFetchResponse.status !== ResponseType.Success) {
      throw new Error('User could not be accessed');
    }

    return userFetchResponse.data as UserV2;
  }

  const processPendingChanges = async () => {
    const failedRequests = await processPrivilegeChanges(
      pendingChanges,
      defaultTenantGlobalId,
      userGlobalId!,
      token,
    );

    if (failedRequests.length > 0) {
      setFailedChanges(failedRequests);
      setFailedChangesDialogOpen(true);
    } else {
      setOpenSuccessPrivAssignmentSnackbar(true);
    }

    const userDto = await fetchUserDto();
    setUser(userDto);
    setEditedPrivileges(JSON.parse(JSON.stringify(userDto.privileges)));
    setPendingChanges([]);
    setEditingPrivileges(false);
    setShowConfirmationDialog(false);
  };

  const handleConfirmPrivileges = async () => {
    await processPendingChanges();
  };
  
  const editUserDetails = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orgGlobalId, isActive, ...otherValues } = editedValues as UserV2;

    // Creating editedValuesDtoFormat object
    const editedValuesDtoFormat: UserPatchV2 = {
      displayName: otherValues.displayName,
      contactEmail: otherValues.contactEmail,
      analysisServerUsername: otherValues.analysisServerUsername,
      position: otherValues.position,
      noDownloadQuota: otherValues.noDownloadQuota,
      monthlyBytesQuota: otherValues.monthlyBytesQuota,
    };
    
    const editedActiveState = user?.isActive !== isActive;
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
      
      if (userResponse.status !== ResponseType.Success) {
        throw new Error('User could not be accessed/changed');
      }
      
      const userDto = await fetchUserDto();
      setUser(userDto);
      setEditedPrivileges(JSON.parse(JSON.stringify(userDto.privileges)));
      setPatchMsg(userResponse.message);
      setPatchSeverity('success');
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
    setOnSaveLoading(false);
    setEditingBasic(false);
  };

  const onSelectionAdd = (
    recordType: string,
    assignedRoles: RoleAssignments[],
  ) => {
    const filteredAssignedRoles = filterAssignedRoles(
      recordType,
      assignedRoles,
      editedPrivileges,
      pendingChanges,
    );
    
    setEditedPrivileges(prev => updateEditedPrivileges(
      prev,
      recordType,
      filteredAssignedRoles,
    ));
    
    setPendingChanges(prev => updatePendingChanges(
      prev,
      recordType,
      filteredAssignedRoles,
    ));
  };

  const onSelectionRemove = (
    role: RecordRole,
    recordType: string,
    recordName: string,
    recordGlobalId: string,
  ) => {
    setEditedPrivileges(prev =>
      removeSelectionFromPrivileges(
        prev,
        recordType,
        recordName,
        role,
      ));
    setPendingChanges(prev =>
      updatePendingChangesForRemoval(
        prev,
        recordType,
        recordGlobalId,
        recordName,
        role,
      ));
  };

  const hasChanges = !deepEqual(user, editedValues);
  const privHasChanges = pendingChanges.length > 0;
  const canSeeEditButtons = () => (loading === LoadingState.SUCCESS && (adminV2 || canEdit));
  return (user) ? (
    <div>
      <Stack
        direction="column"
        justifyContent="space-between"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Icon and Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {renderIcon(user, 'large')}
            <Typography className="pageTitle" style={{ paddingBottom: 0 }}>
              {user.displayName}
            </Typography>
          </div>

          {/* Right: Quota + Dates */}
          
          <Paper elevation={0} variant="outlined" sx={{ padding: '10px' }}>
            
            <Stack direction="row" spacing={3}>
              {/* Left Column: Quota Info */}
              {!user.noDownloadQuota &&
                  (
                  <Stack direction="column" spacing={0.2} minWidth={200}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        variant="caption"
                        fontSize=".8rem"
                        color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                      >
                        Monthly Quota:
                      </Typography>
                      <Typography
                        variant="caption"
                        fontSize=".8rem"
                        color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                      >
                        {bytesToMB(user.monthlyBytesQuota)}
                        {' '}
                        MB
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        variant="caption"
                        fontSize=".8rem"
                        color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                      >
                        Quota Used:
                      </Typography>
                      <Typography
                        variant="caption"
                        fontSize=".8rem"
                        color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                      >
                        {bytesToMB(user.monthlyBytesUsed)}
                        {' '}
                        MB
                      </Typography>
                    </Stack>
                  </Stack>
                  )}

              {/* Right Column: Dates */}
              <Stack direction="column" spacing={0.2} minWidth={200}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    variant="caption"
                    fontSize=".8rem"
                    color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                  >
                    Last Active:
                  </Typography>
                  <Typography
                    variant="caption"
                    fontSize=".8rem"
                    color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                  >
                    {isoDateOrNotRecorded(new Date(user.lastActive).toISOString())}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    variant="caption"
                    fontSize=".8rem"
                    color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                  >
                    Last Login:
                  </Typography>
                  <Typography
                    variant="caption"
                    fontSize=".8rem"
                    color={import.meta.env.VITE_THEME_PRIMARY_GREY_700}
                  >
                    {isoDateOrNotRecorded(new Date(user.lastLogIn).toISOString())}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </div>
        {errMsg && (
          <Alert severity="error" onClose={() => setErrMsg(null)}>
            {errMsg}
          </Alert>
        )}
      </Stack>
      <Grid
        container
        spacing={4}
        flex="flexwrap"
        width="100%"
        alignItems="stretch"
      >
        <Grid size={{ xs: 12, md: 12, lg: 12, xl: 4.5 }}>
          <UserProperties
            user={user}
            editingBasic={editingBasic}
            setEditingBasic={setEditingBasic}
            onSave={onSave}
            handleCancel={handleCancel}
            hasChanges={hasChanges}
            canSee={canSeeEditButtons}
            onSaveLoading={onSaveLoading}
            errMsg={errMsg}
            nonDisplayFields={nonDisplayFields}
            readableNames={readableNames}
            editedValues={editedValues}
            setEditedValues={setEditedValues}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 12, xl: 7.5 }}>
          <UserPrivileges
            editingPrivileges={editingPrivileges}
            setEditingPrivileges={setEditingPrivileges}
            onPrivSave={onPrivSave}
            handlePrivCancel={handlePrivCancel}
            onSaveLoading={onSaveLoading}
            privHasChanges={privHasChanges}
            canSee={canSeeEditButtons}
            editedPrivileges={editedPrivileges}
            openGroupRoles={openGroupRoles}
            setOpenGroupRoles={setOpenGroupRoles}
            onSelectionRemove={onSelectionRemove}
            onSelectionAdd={onSelectionAdd}
          />
        </Grid>
      </Grid>
      <ChangesDialog
        open={showConfirmationDialog}
        onClose={handleCloseDialog}
        pendingChanges={pendingChanges}
        onConfirm={handleConfirmPrivileges}
      />
      <FailedChangesDialog
        open={failedChangesDialogOpen}
        onClose={() => setFailedChangesDialogOpen(false)}
        failedChanges={failedChanges}
        onClear={async () => {
          setFailedChanges([]);
          setFailedChangesDialogOpen(false);
          const userDto = await fetchUserDto();
          setUser(userDto);
          setEditedPrivileges(JSON.parse(JSON.stringify(userDto.privileges)));
        }}
      />
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={patchSeverity as AlertColor}>
          {patchMsg}
        </Alert>
      </Snackbar>
      <Snackbar
        open={openDupSnackbar}
        autoHideDuration={4000}
        onClose={handleDupClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleDupClose} severity="error">
          Group Role already exists
        </Alert>
      </Snackbar>
      <Snackbar
        open={openSuccessPrivAssignmentSnackbar}
        autoHideDuration={4000}
        onClose={handleSuccessPrivAssignmentSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessPrivAssignmentSnackbarClose} severity="success">
          Privileges edited successfully
        </Alert>
      </Snackbar>
    </div>
  ) : null;
}

export default UserV2DetailOverview;
