import {
  Alert,
  type AlertColor,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { deepEqual } from 'vega-lite';
import { useApi } from '../../../app/ApiContext';
import { useAppSelector } from '../../../app/store';
import { selectUserState } from '../../../app/userSlice';
import LoadingState from '../../../constants/loadingState';
import { ResponseType } from '../../../constants/responseType';
import type {
  GroupedPrivilegesByRecordType,
  Organisation,
  RecordRole,
  User,
  UserPatchV2,
} from '../../../types/dtos';
import type { ResponseObject } from '../../../types/responseObject.interface';
import {
  disableUser,
  enableUser,
  getOrganisations,
  getUser,
  patchUser,
  updateUserOrganisation,
} from '../../../utilities/resourceUtils';
import renderIcon from '../../Admin/UserIconRenderer';
import '../../Common/SettingsPage/RowAndCell.css';
import { CheckCircle, Report } from '@mui/icons-material';
import { Theme } from '../../../assets/themes/theme';
import { hasPermissionV2ByRole } from '../../../permissions/accessTable';
import { Roles } from '../../../permissions/roles';
import type { PendingChange, RoleAssignments } from '../../../types/userDetailEdit.interface';
import { isoDateOrNotRecorded } from '../../../utilities/dateUtils';
import {
  checkEditUserScopes,
  checkFetchUserScope,
  filterAssignedRoles,
  removeSelectionFromPrivileges,
  updateEditedPrivileges,
  updatePendingChanges,
  updatePendingChangesForRemoval,
} from '../../../utilities/privilegeUtils';
import { formatBytes } from '../../../utilities/renderUtils';
import ChangesDialogue from '../../Common/SettingsPage/ChangesDialogue';
import { processPrivilegeChanges } from '../privilegeBulkApiCall';
import { FailedChangesDialog } from './FailedChangesDialog';
import { PrivilegesChangeDialogue } from './PrivilegesChangeDialogue';
import UserPrivileges from './UserPrivileges';
import UserProperties from './UserProperties';

function UserDetailOverview() {
  const { username } = useParams();
  const { token, tokenLoading } = useApi();
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPrivileges, setEditingPrivileges] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[] | null>(null);
  const [editedValues, setEditedValues] = useState<User | null>(null);
  const [onSaveLoading, setOnSaveLoading] = useState<boolean>(false);
  const [editedPrivileges, setEditedPrivileges] = useState<GroupedPrivilegesByRecordType[] | null>(
    null,
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [patchMsg, setPatchMsg] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openGroupRoles, setOpenGroupRoles] = useState<string[]>([]);
  const [openDupSnackbar, setOpenDupSnackbar] = useState(false);
  const [patchSeverity, setPatchSeverity] = useState<string>('success');
  const [showPrivConfirmationDialogue, setShowPrivConfirmationDialogue] = useState(false);
  const [showOrgConfirmationDialogue, setShowOrgConfirmationDialogue] = useState(false);
  const [failedChanges, setFailedChanges] = useState<[string | null, PendingChange][]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [failedChangesDialogOpen, setFailedChangesDialogOpen] = useState(false);
  const [openSuccessPrivAssignmentSnackbar, setOpenSuccessPrivAssignmentSnackbar] = useState(false);
  const submitter = useAppSelector(selectUserState);

  const readableNames: Record<string, string> = {
    objectId: 'Object ID',
    username: 'Username',
    globalId: 'Global ID',
    position: 'Position',
    displayName: 'Name',
    analysisServerUsername: 'Linux Username',
    orgName: 'Organisation',
    contactEmail: 'Email',
    isActive: 'Active',
    noDownloadQuota: 'No Download Quota',
    monthlyBytesQuota: 'Download Quota',
    created: 'Joined',
  };

  let nonDisplayFields = [
    'objectId',
    'globalId',
    'orgAbbrev',
    'orgGlobalId',
    'orgId',
    'lastLogIn',
    'lastActive',
    'isAusTrakkaAdmin',
    'isAusTrakkaProcess',
    'monthlyBytesUsed',
    'lastDownloadDate',
  ];

  if (user?.noDownloadQuota) {
    nonDisplayFields.push('monthlyBytesQuota');
  }

  // Add a boolean constant to determine if the user can see this page.
  // Currently, access is only granted to superUser.
  // Instead, the visibility and editability of the page should be checked separately
  // based on the required scopes.

  const canFetch = checkFetchUserScope(submitter.scopes);
  const canEdit = checkEditUserScopes(submitter.scopes);
  const hasAdminRights: boolean = hasPermissionV2ByRole(submitter, Roles.Admin);

  // this should check if it has loaded then if its super user and
  // lastly if they have the scope for fetching the user
  if (
    submitter.loading === LoadingState.SUCCESS &&
    (submitter.superUser || canFetch || hasAdminRights)
  ) {
    nonDisplayFields = nonDisplayFields.filter((field) => field !== 'objectId');
  }

  const onPrivSave = () => {
    if (pendingChanges.length > 0) {
      setShowPrivConfirmationDialogue(true);
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

  const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSnackbar(false);
  };

  const handleDupClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenDupSnackbar(false);
  };

  const handleSuccessPrivAssignmentSnackbarClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSuccessPrivAssignmentSnackbar(false);
  };

  useEffect(() => {
    const updateUser = async () => {
      const userResponse: ResponseObject = await getUser(username!, token);

      if (userResponse.status === ResponseType.Success) {
        const userDto = userResponse.data as User;
        setUser(userDto);
        setEditedPrivileges(JSON.parse(JSON.stringify(userDto.privileges)));
        setEditedValues({ ...userDto });
      } else {
        setErrMsg('User could not be accessed');
      }
    };

    if (
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING &&
      submitter.loading === LoadingState.SUCCESS &&
      username
    ) {
      void updateUser();
    }
  }, [submitter, token, tokenLoading, username]);

  useEffect(() => {
    const fetchOrgs = async () => {
      const orgRes: ResponseObject = await getOrganisations(false, token);

      if (orgRes.status === ResponseType.Success) {
        setOrganisations(orgRes.data);
      } else {
        setErrMsg(orgRes.message);
      }
    };

    if (
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING &&
      submitter.loading === LoadingState.SUCCESS
    ) {
      void fetchOrgs();
    }
  }, [submitter, token, tokenLoading]);

  async function fetchUserDto(): Promise<User> {
    const userFetchResponse: ResponseObject = await getUser(username!, token);

    if (userFetchResponse.status !== ResponseType.Success) {
      throw new Error('User could not be accessed');
    }

    return userFetchResponse.data as User;
  }

  const processPendingChanges = async () => {
    const clientSessionId: string = crypto.randomUUID();

    const failedRequests = await processPrivilegeChanges(
      pendingChanges,
      username!,
      token,
      clientSessionId,
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
    setShowPrivConfirmationDialogue(false);
  };

  const handleConfirmPrivileges = async () => {
    await processPendingChanges();
  };

  const editUserDetails = async () => {
    const { orgAbbrev, isActive, ...otherValues } = editedValues as User;

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
    const editedHomeOrg = user?.orgAbbrev !== orgAbbrev;

    try {
      const clientSessionId: string = crypto.randomUUID();
      // basic patch
      const userResponse: ResponseObject = await patchUser(
        username!,
        editedValuesDtoFormat,
        token,
        clientSessionId,
      );

      if (userResponse.status !== ResponseType.Success) {
        throw new Error('User could not be accessed/changed');
      }

      // enable user
      if (editedActiveState) {
        let userActivateResponse: ResponseObject;
        if (isActive) {
          userActivateResponse = await enableUser(username!, token, clientSessionId);
        } else {
          userActivateResponse = await disableUser(username!, token, clientSessionId);
        }
        if (userActivateResponse.status !== ResponseType.Success) {
          throw new Error('User could not be activated/deactivated');
        }
      }

      if (editedHomeOrg) {
        if (!user?.orgAbbrev) {
          throw new Error('Organisation Abbreviation not found');
        }
        const userOrgUpdateResponse: ResponseObject = await updateUserOrganisation(
          token,
          user?.orgAbbrev,
          orgAbbrev,
          user?.username,
        );
        if (userOrgUpdateResponse.status !== ResponseType.Success) {
          throw new Error(userOrgUpdateResponse.message);
        }
      }

      const userDto = await fetchUserDto();

      setUser(userDto);
      setEditedPrivileges(JSON.parse(JSON.stringify(userDto.privileges)));
      setPatchMsg(userResponse.message);
      setPatchSeverity('success');
    } catch (error: any) {
      setEditedValues(JSON.parse(JSON.stringify(user)));
      setPatchMsg(error.message);
      setPatchSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const saveChanges = async () => {
    setOnSaveLoading(true);

    await editUserDetails();

    setOnSaveLoading(false);
    setEditingBasic(false);
    setShowOrgConfirmationDialogue(false);
  };

  const onSave = async () => {
    if (editedValues === null) return;

    if (editedValues.orgAbbrev !== user?.orgAbbrev) {
      setShowOrgConfirmationDialogue(true);
    } else {
      await saveChanges();
    }
  };

  const onSelectionAdd = (recordType: string, assignedRoles: RoleAssignments[]) => {
    const filteredAssignedRoles = filterAssignedRoles(
      recordType,
      assignedRoles,
      editedPrivileges,
      pendingChanges,
    );

    setEditedPrivileges((prev) => updateEditedPrivileges(prev, recordType, filteredAssignedRoles));

    setPendingChanges((prev) => updatePendingChanges(prev, recordType, filteredAssignedRoles));
  };

  const onSelectionRemove = (
    role: RecordRole,
    recordType: string,
    recordName: string,
    recordGlobalId: string,
  ) => {
    setEditedPrivileges((prev) =>
      removeSelectionFromPrivileges(prev, recordType, recordName, role),
    );
    setPendingChanges((prev) =>
      updatePendingChangesForRemoval(prev, recordType, recordGlobalId, recordName, role),
    );
  };

  const getOrgChangeDialogueMessage = () => {
    const infoItems = [
      `Existing privileges on "${user?.orgAbbrev}" will remain active`,
      `Existing privileges on "${editedValues?.orgAbbrev}" will be respected`,
    ];
    const warningItems = [
      `"${user?.displayName}" will no longer be a member of "${user?.orgAbbrev}"`,
      `User privileges on "${user?.orgAbbrev}" will not be transferred to "${editedValues?.orgAbbrev}"`,
    ];

    return (
      <List sx={{ paddingTop: '20px', paddingBottom: '20px' }} dense>
        {warningItems.map((warningItem) => (
          <ListItem key={warningItem}>
            <ListItemIcon>
              <Report color="error" />
            </ListItemIcon>
            <ListItemText secondary={warningItem} />
          </ListItem>
        ))}
        {infoItems.map((item) => (
          <ListItem key={item}>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText secondary={item} />
          </ListItem>
        ))}
      </List>
    );
  };

  const hasChanges = !deepEqual(user, editedValues);
  const privHasChanges = pendingChanges.length > 0;
  const canSeeEditButtons = () =>
    submitter.loading === LoadingState.SUCCESS &&
    (submitter.superUser || canEdit || hasAdminRights);
  return user ? (
    <div>
      <Stack direction="column" justifyContent="space-between">
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
              {!user.noDownloadQuota && (
                <Stack direction="column" spacing={0.2} minWidth={200}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                      Monthly Quota:
                    </Typography>
                    <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                      {formatBytes(user.monthlyBytesQuota, true)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                      Quota Used:
                    </Typography>
                    <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                      {formatBytes(user.monthlyBytesUsed, true)}
                    </Typography>
                  </Stack>
                </Stack>
              )}

              {/* Right Column: Dates */}
              <Stack direction="column" spacing={0.2} minWidth={200}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                    Last Active:
                  </Typography>
                  <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                    {isoDateOrNotRecorded(new Date(user.lastActive).toISOString())}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
                    Last Login:
                  </Typography>
                  <Typography variant="caption" fontSize=".8rem" color={Theme.PrimaryGrey700}>
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
      <Grid container spacing={4} flex="flexwrap" width="100%" alignItems="stretch">
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
            organisations={organisations ?? []}
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
      <ChangesDialogue
        severity={'warning'}
        title={'Updating Home organisation'}
        isOpen={showOrgConfirmationDialogue}
        onClose={() => setShowOrgConfirmationDialogue(false)}
        onCancel={() => setShowOrgConfirmationDialogue(false)}
        confirmLoading={onSaveLoading}
        onConfirm={saveChanges}
      >
        <Typography variant="body2" fontSize=".9rem" textAlign={'center'}>
          Changing the Organisation for "{user.displayName}" will result in the following:
        </Typography>
        {getOrgChangeDialogueMessage()}
        <Typography variant="body2" fontSize=".9rem" textAlign={'center'}>
          Are you sure you want to continue? All additional changes will also be saved!
        </Typography>
      </ChangesDialogue>
      <PrivilegesChangeDialogue
        open={showPrivConfirmationDialogue}
        onClose={() => setShowPrivConfirmationDialogue(false)}
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

export default UserDetailOverview;
