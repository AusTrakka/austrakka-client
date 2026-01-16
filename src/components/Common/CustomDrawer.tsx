import React, { ReactNode } from 'react';
import { Box, Drawer } from '@mui/material';
import { Theme } from '../../assets/themes/theme';

interface CustomDrawerProps {
  drawerOpen: boolean,
  setDrawerOpen: (open: boolean) => void,
  children: ReactNode,
}

function CustomDrawer({ drawerOpen, setDrawerOpen, children }: CustomDrawerProps): JSX.Element {
  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      slotProps={{
        paper: {
          sx: {
            maxWidth: 600,
            padding: 6,
            borderLeft: 6,
            borderColor: Theme.SecondaryMain,
          },
        },
      }}
    >
      <Box>
        {children}
      </Box>
    </Drawer>
  );
}

export default CustomDrawer;
