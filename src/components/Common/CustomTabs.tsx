import React from 'react';
import {
  Box, Tab, Tabs, LinearProgress,
} from '@mui/material';

/// / Types
export interface TabContentProps {
  index: number,
  title: string
}
interface TabPanelProps {
  children: React.ReactNode;
  tabLoader : boolean,
  index: number;
  value: number;
}
interface CustomTabsProps {
  tabContent: TabContentProps[],
  value: number,
  setValue: React.Dispatch<React.SetStateAction<number>>
}
/// /

export function TabPanel(props: TabPanelProps) {
  const {
    children, tabLoader, value, index,
  } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {
        tabLoader && <LinearProgress color="secondary" />
      }
      <div>
        <Box sx={{ marginTop: 2 }}>
          {children}
        </Box>
      </div>
    </div>
  );
}

export default function CustomTabs(props: CustomTabsProps) {
  const { tabContent, value, setValue } = props;
  // Function to update the URL to match the selected tab
  const updateTabUrl = (tabUrl: string) => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    // Split the path into segments
    const pathSegments = currentPath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Check if the last segment is the project abbreviation
    let newPath: string;
    if (pathSegments.length > 1 &&
        !tabContent.some(tab => tab.title.toLowerCase() === lastSegment)) {
      newPath = currentPath + tabUrl + currentSearch;
    } else {
      // Replace the last part of the path
      newPath = pathSegments.slice(0, -1).join('/') + tabUrl + currentSearch;
    }
    // React Router V6 does not currently provide any way to update the URL without
    // triggering navigation. In this case we are updating the URL to match the updated
    // react state, so a re-render is unnecessary and needs to be avoided for performance.
    window.history.pushState(window.history.state, '', newPath);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);

    // Generate the URL for the selected tab and navigate to it
    const selectedTab = tabContent.find((tab) => tab.index === newValue);
    if (selectedTab) {
      const tabUrl = `/${encodeURIComponent(selectedTab.title.toLowerCase())}`;
      updateTabUrl(tabUrl);
    }
  };

  const InnerTabs = tabContent.map((tab) => (
    <Tab
      key={tab.index}
      label={tab.title}
      sx={{ 'textTransform': 'none', '&.Mui-selected': { fontWeight: 'bold' } }}
      disableRipple
    />
  ));

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleTabChange} indicatorColor="secondary">
          {InnerTabs}
        </Tabs>
      </Box>
    </Box>
  );
}
