// first lets make the get organisation information

import { Alert, Box, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import { NavigationProvider } from '../../app/NavigationContext';
import { useAppSelector } from '../../app/store';
import { selectUserState, type UserSliceState } from '../../app/userSlice';
import LoadingState from '../../constants/loadingState';
import RecordTypes from '../../constants/record-type.enum';
import { ResponseType } from '../../constants/responseType';
import { ScopeDefinitions } from '../../constants/scopes';
import {
  hasPermission,
  hasPermissionV2ByScope,
  PermissionLevel,
} from '../../permissions/accessTable';
import type { GroupRole, Organisation } from '../../types/dtos';
import { getOrganisation } from '../../utilities/resourceUtils';
import Activity from '../Common/Activity/Activity';
import CustomTabs from '../Common/CustomTabs';
import TabPanel from '../Common/TabPanel';
import OrgDashboard from '../Dashboards/OrgDashboard/OrgDashboard';
import OrganisationSamples from './OrganisationSamples';
import OrgMembers from './OrgMemberList';
import { ORG_HOME_TAB, ORG_TABS } from './orgTabConstants';

interface OrganisationOverviewProps {
  orgAbbrev: string;
  tab: string;
}

function OrganisationOverview(props: OrganisationOverviewProps) {
  const { orgAbbrev, tab } = props;
  const { token, tokenLoading } = useApi();
  const location = useLocation();
  const [organisation, setOrganisation] = useState<Organisation>();
  const [tabValue, setTabValue] = useState<number | null>(null);
  const [orgDetailsError, setOrgDetailsError] = useState(false);
  // canShare is used for share and unshare checks
  const [canShare, setCanShare] = useState(false);
  const [canChangeOwnership, setCanChangeOwnership] = useState(false);

  const user: UserSliceState = useAppSelector(selectUserState);

  useEffect(() => {
    const checkSharingPermissions = (ownerGroupName: string) =>
      hasPermission(user, ownerGroupName, 'organisation/sample/share', PermissionLevel.CanShow);
    const ownerOrgGroupName: string | undefined = user.groupRoles.find(
      (groupRole: GroupRole) => groupRole.group.name === `${orgAbbrev}-Owner`,
    )?.group.name;
    if (user.loading === LoadingState.SUCCESS && (ownerOrgGroupName || user.admin)) {
      // give it an empty string if only the admin check passed in the or condition above
      setCanShare(checkSharingPermissions(ownerOrgGroupName ?? ''));
    }
  }, [orgAbbrev, user]);

  useEffect(() => {
    const checkChangeOwnershipPermissions = () =>
      hasPermissionV2ByScope(
        user,
        ScopeDefinitions.ChangeSamplesOwner,
        orgAbbrev,
        RecordTypes.ORGANISATION,
      );
    if (user.loading === LoadingState.SUCCESS && (orgAbbrev || user.admin)) {
      setCanChangeOwnership(checkChangeOwnershipPermissions());
    }
  }, [orgAbbrev, user]);

  useEffect(() => {
    function getMyOrgDetails() {
      //!TODO: this exists as a workaround for the fact that the getOrganisation() API call
      //  currently only works for admins. Non-admins must therefore use this function to
      //  get their own org details. This means some details like Country, State are not set.

      setOrganisation({
        abbreviation: orgAbbrev,
        name: user.orgName,
        isActive: true,
        globalId: user.orgGlobalId,
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

    if (
      user.loading === LoadingState.SUCCESS &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING
    ) {
      if (orgAbbrev === user.orgAbbrev) {
        // This is only needed because non-admins cannot yet request org details from the API
        getMyOrgDetails();
      } else {
        getOrgDetails();
      }
    } else if (user.loading === LoadingState.ERROR) {
    }
  }, [orgAbbrev, token, tokenLoading, user]);

  useEffect(() => {
    const tabKey = tab.toLowerCase(); // e.g. "plots"
    const tabObj = ORG_TABS[tabKey];
    if (tabObj) {
      setTabValue(tabObj.index);
    }
  }, [tab]);

  // If groupStatus is error, or orgDetailsError is true, or the user is not in any groups,
  // we cannot show the page. Give a generic message
  if (orgDetailsError) {
    return <Alert severity="error">There was an error loading the organisation data</Alert>;
  }

  // If organisation details not loaded yet, but no error
  if (!organisation) {
    return <Typography>Loading...</Typography>;
  }

  if (tabValue === null) {
    return null;
  }

  // NB alternate return() calls above
  return (
    <>
      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h3" color="primary">
            {`${organisation.name} (${organisation?.abbreviation})`}
          </Typography>
        </Stack>
      </Box>
      <CustomTabs value={tabValue} setValue={setTabValue} tabContent={Object.values(ORG_TABS)} />
      <TabPanel value={tabValue} index={0}>
        <OrganisationSamples
          canShare={canShare}
          orgAbbrev={orgAbbrev}
          canChangeOwnership={canChangeOwnership}
          orgName={organisation.name}
          key={location.search}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <OrgMembers orgAbbrev={orgAbbrev} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <Activity recordType="Organisation" rGuid={organisation.globalId} />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <OrgDashboard orgAbbrev={orgAbbrev} />
      </TabPanel>
    </>
  );
}

function OrganisationOverviewWrapper() {
  const { orgAbbrev, tab } = useParams();
  if (!orgAbbrev) return null;
  let resolvedTab: string = tab ?? ORG_HOME_TAB;
  const allowedKeys: string[] = Object.keys(ORG_TABS) as Array<string>;
  if (!allowedKeys.includes(resolvedTab)) {
    window.history.replaceState(null, '', `/org/${orgAbbrev}`);
    resolvedTab = ORG_HOME_TAB;
  }
  return (
    <NavigationProvider>
      <OrganisationOverview orgAbbrev={orgAbbrev} tab={resolvedTab} />
    </NavigationProvider>
  );
}

export default OrganisationOverviewWrapper;
