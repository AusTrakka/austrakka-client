import { Typography } from '@mui/material';
import React, { Dispatch, FC, ReactNode, SetStateAction, useMemo } from 'react';
import CustomTabs, { TabContentProps } from '../CustomTabs';

interface TabbedPageProps {
  title: string;
  headers: TabContentProps[];
  tabValue: number;
  setTabValue: Dispatch<SetStateAction<number>>;
  children: ReactNode;
}

const TabbedPage : FC<TabbedPageProps> = (props) => {
  const tabs: TabContentProps[] = useMemo(() => props.headers, []);
    
  return (
    <>
      <Typography className="pageTitle">{props.title}</Typography>
      <CustomTabs value={props.tabValue} tabContent={tabs} setValue={props.setTabValue} />
      {props.children}
    </>
  );
};

export default TabbedPage;
