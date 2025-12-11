import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { PLATFORM_HOME_TAB, PLATFORM_TABS } from './platformTabConstants';
import TabPanel from '../Common/TabPanel';
import Activity from '../Common/Activity/Activity';
import { NavigationProvider } from '../../app/NavigationContext';

interface PlatformProps {
  tab: string,
}

function Platform(props: PlatformProps) {
  const { tab } = props;
  const [tabValue, setTabValue] = useState<number | null>(null);
  
  useEffect(() => {
    const tabKey = tab.toLowerCase(); // e.g. "plots"
    const tabObj = PLATFORM_TABS[tabKey];

    if (tabObj) {
      setTabValue(tabObj.index);
    }
  }, [tab]);

  if (tabValue === null) { return null; }
  
  return (
    <>
      <Typography className="pageTitle">
        Platform
      </Typography>
      <TabPanel index={PLATFORM_TABS.activity.index} value={tabValue}>
        <Activity
          recordType="Tenant"
          rGuid=""
        />
      </TabPanel>
    </>
  );
}

function PlatformWrapper() {
  const { tab } = useParams();
  return (
    <NavigationProvider>
      <Platform tab={tab ?? PLATFORM_HOME_TAB} />
    </NavigationProvider>
  );
}
export default PlatformWrapper;
