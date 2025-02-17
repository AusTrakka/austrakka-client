import React, {useState} from "react";
import {Box, Chip, Drawer, Typography} from "@mui/material";
import {HelpOutline, ListAlt} from "@mui/icons-material";

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
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >

        <Box
          sx={{maxWidth: 600, padding: 6, borderLeft: 6, borderColor: 'secondary.main', height: '100%'}}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={() => setDrawerOpen(false)}
        >
          <ListAlt fontSize="large" color="primary"/>
          <Typography variant="h4" color="primary">
            {title}
          </Typography>
          <br/>
          {content}
        </Box>
      </Drawer>
    </>
  )
}