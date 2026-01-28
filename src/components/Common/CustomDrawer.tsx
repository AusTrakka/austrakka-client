import React, { ReactNode, useState, useRef } from 'react';
import { Box, Drawer, IconButton, Tooltip } from '@mui/material';
import { KeyboardDoubleArrowUp } from '@mui/icons-material';
import { Theme } from '../../assets/themes/theme';

interface CustomDrawerProps {
  drawerOpen: boolean,
  setDrawerOpen: (open: boolean) => void,
  children: ReactNode,
}

function CustomDrawer({ drawerOpen, setDrawerOpen, children }: CustomDrawerProps): JSX.Element {
  const [showButton, setShowButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowButton(scrollRef.current.scrollTop > 50);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      slotProps={{
        paper: {
          sx: {
            maxWidth: 600,
            borderLeft: 6,
            borderColor: Theme.SecondaryMain,
          },
        },
      }}
    >
      <Box
        ref={scrollRef}
        sx={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          position: 'relative',
          padding: 6,
            
        }}
        onScroll={handleScroll}
      >
        {children}
        {showButton && (
          <Tooltip title="Scroll to top" placement="left" arrow>
            <IconButton
              onClick={scrollToTop}
              sx={{
                'position': 'fixed',
                'bottom': 20,
                'right': 20,
                'zIndex': 1000,
                'color': Theme.PrimaryMain,
                'backgroundColor': Theme.PrimaryMainBackground,
                '&:hover': {
                  backgroundColor: Theme.PrimaryMain,
                  color: 'white',
                },
              }}
            >
              <KeyboardDoubleArrowUp />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Drawer>
  );
}

export default CustomDrawer;
