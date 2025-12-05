// first lets make the get organisation information
import React, { useEffect, useState } from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import LoadingState from '../../constants/loadingState';
import { getGroupList, getGroupMembers, getOrganisation } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { Group, GroupRole, Member, Organisation } from '../../types/dtos';
import CustomTabs from '../Common/CustomTabs';
import OrganisationSamples from './OrganisationSamples';
import OrgSimpleMemberList from './OrgSimpleMemberList';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { selectUserState, UserSliceState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import TabPanel from '../Common/TabPanel';
import { ORG_HOME_TAB, ORG_TABS } from './orgTabConstants';
import { NavigationProvider } from '../../app/NavigationContext';
import { hasPermission, PermissionLevel } from '../../permissions/accessTable';

const getCorrectGroups = (groupRoles: GroupRole[], orgAbbrev: string): GroupRole[] =>
  groupRoles.filter((groupRole: GroupRole) =>
    (groupRole.group.name === `${orgAbbrev}-Owner`
            || groupRole.group.name === `${orgAbbrev}-Everyone`)
        && (groupRole.role.name === 'Viewer'))
    .sort((a: any, b: any) => {
      // Owner group first
      if (a.group.name.endsWith('-Owner') && b.group.name.endsWith('-Owner')) return 0;
      if (a.group.name.endsWith('-Owner')) return -1;
      if (b.group.name.endsWith('-Owner')) return 1;
      return 0;
    });

const getCorrectGroupsAdmin = (groups: Group[], orgAbbrev: string): Group[] =>
  groups.filter((group: Group) => (
    group.name === `${orgAbbrev}-Owner`
        || group.name === `${orgAbbrev}-Everyone`)).sort((a: any, b: any) => {
    // Owner group first
    if (a.name.endsWith('-Owner') && b.name.endsWith('-Owner')) return 0;
    if (a.name.endsWith('-Owner')) return -1;
    if (b.name.endsWith('-Owner')) return 1;
    return 0;
  });

interface OrganisationOverviewProps {
  orgAbbrev: string,
  tab: string,
}

function OrganisationOverview(props: OrganisationOverviewProps) {
  const { orgAbbrev, tab } = props;
  const [organisation, setOrganisation] = useState<Organisation>();
  const [orgEveryone, setOrgEveryone] = useState<Group>();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [groupsStatus, setGroupStatus] = useState(LoadingState.IDLE); const [groupStatusMessage, setGroupStatusMessage] = useState('');
  const [isUserGroupsLoading, setIsUserGroupsLoading] = useState<boolean>(true);
  const { token, tokenLoading } = useApi();
  const [tabValue, setTabValue] = useState<number | null>(null);
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [orgDetailsError, setOrgDetailsError] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [memberListError, setMemberListError] = useState(false);
  const [memberListErrorMessage, setMemberListErrorMessage] = useState('');
  const [canShare, setCanShare] = useState(false);

  const user: UserSliceState = useAppSelector(selectUserState);

  useEffect(() => {
    const checkSharingPermissions = (ownerGroupName: string) => hasPermission(
      user,
      ownerGroupName,
      'organisation/sample/share',
      PermissionLevel.CanShow,
    );
    const ownerOrgGroupName: string | undefined = user.groupRoles
      .find((groupRole: GroupRole) => groupRole.group.name === `${orgAbbrev}-Owner`)?.group.name;
    if (user.loading === LoadingState.SUCCESS &&
        (ownerOrgGroupName || user.admin)
    ) {
      // give it an empty string if only the admin check passed in the or condition above
      setCanShare(checkSharingPermissions(ownerOrgGroupName ?? ''));
    }
  }, [orgAbbrev, user]);

  useEffect(() => {
    function getMyOrgDetails() {
      // TODO this exists as a workaround for the fact that the getOrganisation() API call
      //  currently only works for admins. Non-admins must therefore use this function to
      //  get their own org details. This means some details like Country, State are not set.
      setOrganisation({
        abbreviation: orgAbbrev,
        name: user.orgName,
        isActive: true,
      } as Organisation);
    }
    
    async function getOrgDetails() {
      // Non-admins currently may not access other org's pages, as this call will fail
      const orgResponse = await getOrganisation(orgAbbrev!, token);
      if (orgResponse.status === ResponseType.Success) {
        setOrganisation(orgResponse.data);
      } else {
        // We are not distinguishing between a permissions error or a retrieval error
        // Either way we cannot safely show this page
        setOrgDetailsError(true);
      }
    }
    
    async function getGroups() {
      setGroupStatus(LoadingState.LOADING);
      const { groupRoles, admin } = user;
      if (!admin) {
        const orgViewerGroups = getCorrectGroups(groupRoles, orgAbbrev);
        setOrgEveryone(orgViewerGroups.find((groupRole: GroupRole) =>
          groupRole.group.name === `${orgAbbrev}-Everyone`)?.group);
        setUserGroups(orgViewerGroups.map((groupRole: GroupRole) => groupRole.group));
      } else {
        const groupsResponseObject : ResponseObject = await getGroupList(token);
        if (groupsResponseObject.status === ResponseType.Success) {
          const groupsData = groupsResponseObject.data as Group[];
          const orgAdminGroups = getCorrectGroupsAdmin(groupsData, orgAbbrev);
          setOrgEveryone(orgAdminGroups.find((group: Group) =>
            group.name === `${orgAbbrev}-Everyone`));
          setUserGroups(orgAdminGroups);
        }
      }
      setIsUserGroupsLoading(false);
      setGroupStatus(LoadingState.SUCCESS);
    }

    if (user.loading === LoadingState.SUCCESS &&
        tokenLoading !== LoadingState.IDLE &&
         tokenLoading !== LoadingState.LOADING) {
      if (orgAbbrev === user.orgAbbrev) {
        // This is only needed because non-admins cannot yet request org details from the API
        getMyOrgDetails();
      } else {
        getOrgDetails();
      }
      getGroups();
    } else if (user.loading === LoadingState.ERROR) {
      setGroupStatus(LoadingState.ERROR);
      setGroupStatusMessage(user.errorMessage);
    }
  }, [orgAbbrev, token, tokenLoading, user]);
  
  // THIS SHOULD BE LOADED IN THE TAB NOT IN THE OVERVIEW.
  useEffect(() => {
    async function getOrgMembersList() {
      if (orgEveryone) {
        const memberListResponse: ResponseObject =
          await getGroupMembers(orgEveryone.groupId, token);
        if (memberListResponse.status === ResponseType.Success) {
          setProjectMembers(memberListResponse.data as Member[]);
          setMemberListError(false);
          setIsMembersLoading(false);
        } else {
          setIsMembersLoading(false);
          setProjectMembers([]);
          setMemberListError(true);
          setMemberListErrorMessage(memberListResponse.message);
        }
      }
    }

    if (groupsStatus === LoadingState.SUCCESS ||
      (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING)) {
      getOrgMembersList();
    }
  }, [token, tokenLoading, groupsStatus, orgEveryone]);

  useEffect(() => {
    const tabKey = tab.toLowerCase(); // e.g. "plots"
    const tabObj = ORG_TABS[tabKey];

    if (tabObj) {
      setTabValue(tabObj.index);
    }
  }, [tab]);

  // If groupStatus is error, or orgDetailsError is true, or the user is not in any groups, 
  // we cannot show the page. Give a generic message
  if (orgDetailsError || groupsStatus === LoadingState.ERROR ||
    (groupsStatus === LoadingState.SUCCESS && userGroups.length === 0)
  ) {
    return (
      <Alert severity="error">
        There was an error loading the organisation data
      </Alert>
    );
  }
  
  // If organisation details not loaded yet, but no error
  if (!organisation ||
    groupsStatus === LoadingState.LOADING ||
    groupsStatus === LoadingState.IDLE ||
      isUserGroupsLoading
  ) {
    return (
      <Typography>
        Loading...
      </Typography>
    );
  }
  
  if (tabValue === null) { return null; }

  // NB alternate return() calls above
  return (
    <>
      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h2" color="primary">
            {`${organisation.name} (${organisation?.abbreviation})`}
          </Typography>
        </Stack>
      </Box>
      <CustomTabs value={tabValue} setValue={setTabValue} tabContent={Object.values(ORG_TABS)} />
      <TabPanel value={tabValue} index={0}>
        <OrganisationSamples
          defaultGroup={userGroups![0]}
          groups={userGroups!}
          groupStatus={groupsStatus}
          groupStatusMessage={groupStatusMessage}
          canShare={canShare}
          orgAbbrev={orgAbbrev}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <OrgSimpleMemberList
          isMembersLoading={isMembersLoading}
          memberList={projectMembers}
          memberListError={memberListError}
          memberListErrorMessage={memberListErrorMessage}
        />
      </TabPanel>
    </>
  );
}

function OrganisationOverviewWrapper() {
  const { orgAbbrev, tab } = useParams();
  if (!orgAbbrev) return null;
  return (
    <NavigationProvider>
      <OrganisationOverview orgAbbrev={orgAbbrev} tab={tab ?? ORG_HOME_TAB} />
    </NavigationProvider>
  );
}

export default OrganisationOverviewWrapper;
