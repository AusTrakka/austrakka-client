import React, { useState } from 'react';
import TabbedPage from '../Common/Page/TabbedPage';
import { PLATFORM_TABS } from './platformTabConstants';
import { TabPanel } from '../Common/CustomTabs';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import Activity from '../Common/Activity/Activity';

function Platform() {
  const [tabValue, setTabValue] = useState(0);
  const user: UserSliceState = useAppSelector(selectUserState);
    
  return (
    <TabbedPage
      title="AusTrakka"
      headers={PLATFORM_TABS}
      setTabValue={setTabValue}
      tabValue={tabValue}
    >
      {tabValue === 0 && (
      <TabPanel tabLoader={false} index={0} value={tabValue}>
        <Activity
          recordType="tenant"
          rguid={user.defaultTenantGlobalId}
          owningTenantGlobalId={user.defaultTenantGlobalId}
        />
      </TabPanel>
      )}
            
    </TabbedPage>
  );
}

export default Platform;
