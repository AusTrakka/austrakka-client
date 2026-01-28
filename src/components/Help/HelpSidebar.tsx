import React, { useState } from 'react';
import { Chip, Typography } from '@mui/material';
import { HelpOutline, ListAlt } from '@mui/icons-material';
import CustomDrawer from '../Common/CustomDrawer';

interface HelpSidebarProps {
  content: React.ReactElement,
  title: string,
  chipLabel: string,
}

export default function HelpSidebar(props: HelpSidebarProps) {
  const { content, title, chipLabel } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer =
    (open: boolean) =>
      (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
          event.type === 'keydown' &&
          ((event as React.KeyboardEvent).key === 'Tab' ||
            (event as React.KeyboardEvent).key === 'Shift')
        ) {
          return;
        }
        setDrawerOpen(open);
      };
  return (
    <>
      <Chip
        icon={<HelpOutline />}
        label={chipLabel}
        onClick={toggleDrawer(true)}
      />
      <CustomDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        <ListAlt fontSize="large" color="primary" />
        <Typography variant="h4" color="primary">
          {title}
        </Typography>
        <br />
        {content}
      </CustomDrawer>
    </>
  );
}
