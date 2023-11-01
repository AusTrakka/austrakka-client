import React from 'react';
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
      { tabLoader ? <LinearProgress color="secondary" /> : (
        <div>
          {value === index && (
          <Box sx={{ marginTop: 2 }}>
            {children}
          </Box>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomTabs(props: CustomTabsProps) {
  const { tabContent, value, setValue } = props;
  const navigate = useNavigate();
  // Function to navigate to the selected tab
  const navigateToTab = (tabUrl: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/\/[^/]+$/, tabUrl); // Replace the last part of the path
    navigate(newPath);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);

    // Generate the URL for the selected tab and navigate to it
    const selectedTab = tabContent.find((tab) => tab.index === newValue);
    if (selectedTab) {
      const tabUrl = `/${encodeURIComponent(selectedTab.title)}`;
      navigateToTab(tabUrl);
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
