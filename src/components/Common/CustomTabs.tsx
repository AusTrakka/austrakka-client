import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { useStableNavigate } from '../../app/NavigationContext';

/// / Types
export interface TabContentProps {
  index: number,
  title: string
}
interface CustomTabsProps {
  tabContent: TabContentProps[],
  value: number,
  setValue: React.Dispatch<React.SetStateAction<number | null>>
}

export type TabObjectRecord = Record<string, TabContentProps>;

export default function CustomTabs(props: CustomTabsProps) {
  const { tabContent, value, setValue } = props;
  const { navigate } = useStableNavigate();
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
    navigate(newPath);
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
        <Tabs value={value} onChange={handleTabChange} indicatorColor="secondary" variant="scrollable">
          {InnerTabs}
        </Tabs>
      </Box>
    </Box>
  );
}
