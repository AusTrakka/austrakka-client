import React, { useEffect, useState } from 'react';
import {
  Box, Tab, Tabs, LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

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

export function TabPanel(props: TabPanelProps) {
  const {
    children, tabLoader, value, index,
  } = props;

  // Mount the panel when it is first selected, and do not unmount it when it is deselected
  // Keeping the set tab state just for this thing I'm not sure the effects of it but lets see
  const [visited, setVisited] = useState<boolean>(false);

  useEffect(() => {
    if (value === index) {
      setVisited(true);
    }
  }, [value, index]);

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
      { visited && (
        <div>
          <Box sx={{ marginTop: 2 }}>
            {children}
          </Box>
        </div>
      )}
    </div>
  );
}

export default function CustomTabs(props: CustomTabsProps) {
  const { tabContent, value, setValue } = props;
  const navigate = useNavigate();

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
        <Tabs value={value} onChange={handleTabChange} indicatorColor="secondary">
          {InnerTabs}
        </Tabs>
      </Box>
    </Box>
  );
}
