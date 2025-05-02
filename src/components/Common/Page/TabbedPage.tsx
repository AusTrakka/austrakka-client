import { Typography } from '@mui/material';
import React, { Dispatch, ReactNode, SetStateAction, useMemo } from 'react';
import CustomTabs, { TabContentProps } from '../CustomTabs';

interface TabbedPageProps {
  title: string;
  headers: TabContentProps[];
  tabValue: number;
  setTabValue: Dispatch<SetStateAction<number>>;
  children: ReactNode;
}

function TabbedPage({ headers, tabValue, setTabValue, children, title }: TabbedPageProps): any {
  const tabs: TabContentProps[] = useMemo(() => headers, [headers]);
    
  return (
    <>
      <Typography className="pageTitle">{title}</Typography>
      <CustomTabs value={tabValue} tabContent={tabs} setValue={setTabValue} />
      {children}
    </>
  );
}

export default TabbedPage;
