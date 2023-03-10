import React, { useEffect, useState } from 'react';
import { Typography, Box, Tab, Tabs, Paper, withStyles, styled } from "@mui/material";

//// Types
interface StyledTabsProps {
    children?: React.ReactNode;
    value: number;
    onChange: (event: React.SyntheticEvent, newValue: number) => void;
}
interface StyledTabProps {
    label: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
interface TabContentProps {
    index: number, 
    title: string, 
    component: JSX.Element
}
interface CustomTabsProps {
    tabContent: TabContentProps[]
}
////
  
const StyledTabs = styled((props: StyledTabsProps) => (
    <Tabs
        {...props}
        TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
    />
    ))({
    '& .MuiTabs-indicator': {
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    '& .MuiTabs-indicatorSpan': {
        width: '100%',
        backgroundColor: '#90CA6D',
    },
});
  

  
const StyledTab = styled((props: StyledTabProps) => (
    <Tab disableRipple {...props} />
))(({ theme }) => ({
    textTransform: 'none',
    color: '#353333',
    '&.Mui-selected': {
      color: '#353333',
      fontWeight: 'bold'
    }
}));

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}
  
  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
        >
        {value === index && (
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
        )}
        </div>
    );
  }
  
export default function CustomTabs(props: CustomTabsProps) {
    const {tabContent} = props
    const [value, setValue] = React.useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
    }
    const Tabs = tabContent.map(tab => 
        <StyledTab key={tab.index} label={tab.title} {...a11yProps(tab.index)}/>
    )
    const TabPanels = tabContent.map(tab => 
        <TabPanel key={tab.index} value={value} index={tab.index}>
            {tab.component}
        </TabPanel>
    )
  
    return (
        <>
            <Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <StyledTabs value={value} onChange={handleTabChange} >
                    {Tabs}
                </StyledTabs>
                </Box>
            </Box>
            {TabPanels}
        </>
    );
}