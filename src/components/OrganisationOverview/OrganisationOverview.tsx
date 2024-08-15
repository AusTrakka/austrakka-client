// first lets make the get organisation information
import React, { memo, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import LoadingState from '../../constants/loadingState';
import { getGroupList, getGroupMembers } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { Member, GroupRole, Group } from '../../types/dtos';
import CustomTabs, { TabContentProps, TabPanel } from '../Common/CustomTabs';
import OrganisationSamples from './OrganisationSamples';
import OrgSimpleMemberList from './OrgSimpleMemberList';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';

function OrganisationOverview() {
  const { orgAbbrev } = useParams();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [groupsStatus, setGroupStatus] = useState(LoadingState.IDLE);
  const [groupStatusMessage, setGroupStatusMessage] = useState('');
  const [isUserGroupsLoading, setIsUserGroupsLoading] = useState<boolean>(true);
  const [orgEveryone, setOrgEveryone] = useState<Group>();
  const { token, tokenLoading } = useApi();
  const [tabValue, setTabValue] = useState(0);
  const [organisationName, setOrganisationName] = useState('');
  const [orgAbbreviation, setOrgAbbreviation] = useState('');
  const location = useLocation();
  const pathName = location.pathname;
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [memberListError, setMemberListError] = useState(false);
  const [memberListErrorMessage, setMemberListErrorMessage] = useState('');

  const user: UserSliceState = useAppSelector(selectUserState);

  useEffect(() => {
    const getCorrectGroups = (groupRoles: GroupRole[]) =>
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

    const getCorrectGroupsAdmin = (groups: Group[]) =>
      groups.filter((group: Group) => (
        group.name === `${orgAbbrev}-Owner`
            || group.name === `${orgAbbrev}-Everyone`)).sort((a: any, b: any) => {
        // Owner group first
        if (a.name.endsWith('-Owner') && b.name.endsWith('-Owner')) return 0;
        if (a.name.endsWith('-Owner')) return -1;
        if (b.name.endsWith('-Owner')) return 1;
        return 0;
      });

    async function getGroups() {
      setGroupStatus(LoadingState.LOADING);
      const { groupRoles, orgName, admin } = user;
      if (!admin) {
        const orgViewerGroups = getCorrectGroups(groupRoles);
        setOrgEveryone(orgViewerGroups.find((groupRole: GroupRole) =>
          groupRole.group.name === `${orgAbbrev}-Everyone`)?.group);
        setUserGroups(orgViewerGroups.map((groupRole: GroupRole) => groupRole.group));
      } else {
        const groupsResponseObject : ResponseObject = await getGroupList(token);
        if (groupsResponseObject.status === ResponseType.Success) {
          const groupsData = groupsResponseObject.data as Group[];
          const orgAdminGroups = getCorrectGroupsAdmin(groupsData);
          setOrgEveryone(orgAdminGroups.find((group: Group) =>
            group.name === `${orgAbbrev}-Everyone`));
          setUserGroups(orgAdminGroups);
        }
      }
      setIsUserGroupsLoading(false);
      setGroupStatus(LoadingState.SUCCESS);
      setOrganisationName(orgName);
      setOrgAbbreviation(orgAbbrev!);
    }

    if (user.loading === LoadingState.SUCCESS &&
        tokenLoading !== LoadingState.IDLE &&
         tokenLoading !== LoadingState.LOADING) {
      getGroups();
    } else if (user.loading === LoadingState.ERROR) {
      setGroupStatus(LoadingState.ERROR);
      setGroupStatusMessage(user.errorMessage);
    }
  }, [orgAbbrev, token, tokenLoading, user]);

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

  const orgOverviewTabs: TabContentProps[] = useMemo(() => [
    {
      index: 0,
      title: 'Samples',
    },
    {
      index: 1,
      title: 'Members',
    },
  ], []);

  useEffect(() => {
    const initialTabValue = orgOverviewTabs
      .findIndex((tab) => pathName.endsWith(tab.title.toLowerCase()));
    if (initialTabValue !== -1) {
      setTabValue(initialTabValue);
    }
  }, [pathName, orgOverviewTabs]);

  return (
    groupsStatus === LoadingState.ERROR || (!user.admin && orgAbbrev !== user.orgAbbrev)
      ? (
        <Alert severity="error">
          {groupsStatus === LoadingState.ERROR
            ? groupStatusMessage
            : 'You do not have access to this page'}
        </Alert>
      )
      : (
        <>
          <Box>
            <Typography variant="h2" color="primary">
              {`${organisationName} (${orgAbbreviation})`}
            </Typography>
          </Box>
          <CustomTabs value={tabValue} setValue={setTabValue} tabContent={orgOverviewTabs} />
          <TabPanel value={tabValue} index={0} tabLoader={isUserGroupsLoading}>
            {isUserGroupsLoading ? null : (
              <OrganisationSamples
                defaultGroup={userGroups![0]}
                groups={userGroups!}
                groupStatus={groupsStatus}
                groupStatusMessage={groupStatusMessage}
              />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1} tabLoader={isMembersLoading}>
            <OrgSimpleMemberList
              isMembersLoading={isMembersLoading}
              memberList={projectMembers}
              memberListError={memberListError}
              memberListErrorMessage={memberListErrorMessage}
            />
          </TabPanel>
        </>
      )
  );
}
export default memo(OrganisationOverview);
