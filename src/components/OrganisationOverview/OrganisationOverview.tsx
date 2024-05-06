// first lets make the get organisation information
import React, { memo, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import LoadingState from '../../constants/loadingState';
import { getGroupMembers, getMe } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { Member, GroupRole } from '../../types/dtos';
import CustomTabs, { TabContentProps, TabPanel } from '../Common/CustomTabs';
import OrganisationSamples from './OrganisationSamples';
import OrgSimpleMemberList from './OrgSimpleMemberList';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';

function OrganisationOverview() {
  const [userGroups, setUserGroups] = useState<GroupRole[]>([]);
  const [groupsStatus, setGroupStatus] = useState(LoadingState.IDLE);
  const [groupStatusMessage, setGroupStatusMessage] = useState('');
  const [isUserGroupsLoading, setIsUserGroupsLoading] = useState<boolean>(true);
  const [orgEveryone, setOrgEveryone] = useState<GroupRole>();
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

  useEffect(() => {
    async function getGroups() {
      setGroupStatus(LoadingState.LOADING);
      const groupResponse: ResponseObject = await getMe(token);
      if (groupResponse.status === ResponseType.Success) {
        const { orgAbbrev,
          groupRoles,
          orgName } = groupResponse.data;
        // This is strictly Owner and Everyone groups
        // Could instead check group organisation, if we want to include ad-hoc org groups
        const orgViewerGroups = groupRoles.filter((groupRole: GroupRole) =>
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
        setOrgEveryone(orgViewerGroups.find((groupRole: GroupRole) =>
          groupRole.group.name === `${orgAbbrev}-Everyone`));
        setUserGroups(orgViewerGroups);
        setIsUserGroupsLoading(false);
        setGroupStatus(LoadingState.SUCCESS);
        setOrganisationName(orgName);
        setOrgAbbreviation(orgAbbrev);
      } else {
        setGroupStatus(LoadingState.ERROR);
        setGroupStatusMessage(groupResponse.message);
      }
    }
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getGroups();
    }
  }, [token, tokenLoading]);

  useEffect(() => {
    async function getOrgMembersList() {
      if (orgEveryone) {
        const memberListResponse: ResponseObject =
          await getGroupMembers(orgEveryone.group.groupId, token);
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
    groupsStatus === LoadingState.ERROR
      ? (
        <Alert severity="error">
          {groupStatusMessage}
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
