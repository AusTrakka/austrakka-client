// first lets make the get organisation information
import React, { memo, useEffect, useState } from 'react';
import { Alert, Box, Grid, Stack, Typography } from '@mui/material';
import LoadingState from '../../constants/loadingState';
import { ResponseObject, getGroupMembers, getUserGroups } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { Member, UserRoleGroup } from '../../types/dtos';
import CustomTabs, { TabContentProps, TabPanel } from '../Common/CustomTabs';
import OrganisationSamples from './OrganisationSamples';
import OrgSimpleMemberList from './OrgSimpleMemberList';

function OrganisationOverview() {
  const [userGroups, setUserGroups] = useState<UserRoleGroup[]>([]);
  const [groupsStatus, setGroupStatus] = useState(LoadingState.IDLE);
  const [groupStatusMessage, setGroupStatusMessage] = useState('');
  const [isUserGroupsLoading, setIsUserGroupsLoading] = useState<boolean>(true);
  const [orgEveryone, setOrgEveryone] = useState<UserRoleGroup>();
  const { token, tokenLoading } = useApi();
  const [tabValue, setTabValue] = useState(0);

  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [memberListError, setMemberListError] = useState(false);
  const [memberListErrorMessage, setMemberListErrorMessage] = useState('');

  useEffect(() => {
    async function getGroups() {
      setGroupStatus(LoadingState.LOADING);
      const groupResponse: ResponseObject = await getUserGroups(token);
      if (groupResponse.status === 'Success') {
        const { organisation, userRoleGroup }:
        { organisation: { abbreviation: string, id: number },
          userRoleGroup: UserRoleGroup[] } = groupResponse.data;
          // This is strictly Owner and Everyone groups
          // Could instead check group organisation, if we want to include ad-hoc org groups
        const orgViewerGroups = userRoleGroup.filter((roleGroup: UserRoleGroup) =>
          (roleGroup.group.name === `${organisation.abbreviation}-Owner`
                || roleGroup.group.name === `${organisation.abbreviation}-Everyone`)
              && (roleGroup.role.name === 'Viewer'))
          .sort((a: any, b: any) => {
            // Owner group first
            if (a.group.name.endsWith('-Owner') && b.group.name.endsWith('-Owner')) return 0;
            if (a.group.name.endsWith('-Owner')) return -1;
            if (b.group.name.endsWith('-Owner')) return 1;
            return 0;
          });
        setOrgEveryone(orgViewerGroups.find((roleGroup: UserRoleGroup) =>
          roleGroup.group.name === `${organisation.abbreviation}-Everyone`));
        setUserGroups(orgViewerGroups);
        setIsUserGroupsLoading(false);
        setGroupStatus(LoadingState.SUCCESS);
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
          await getGroupMembers(orgEveryone.group.id, token);
        if (memberListResponse.status === 'Success') {
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

  const orgOverviewTabs: TabContentProps[] = [
    {
      index: 0,
      title: 'Samples',
    },
    {
      index: 1,
      title: 'Members',
    },
  ];

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
            <Grid container direction="column">
              <Typography variant="h2" color="primary">Organisation Data</Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ paddingTop: 3 }} align="left" variant="subtitle2" color="primary">
                  View samples owned by your organisation.
                  Please note you will only be able to view
                  <em> all </em>
                  data for the organisation you are in,
                  if you are a
                  <b> viewer </b>
                  in your organisation&lsquo;s
                  <b> Owner group</b>
                  s.
                </Typography>
              </Stack>
            </Grid>
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
              // projectAbbrev={orgEveryone?.group.name!}
            />
          </TabPanel>
        </>
      )
  );
}
export default memo(OrganisationOverview);
