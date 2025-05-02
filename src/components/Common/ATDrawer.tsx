import React, { FC, ReactNode } from 'react';
import { Backdrop, Box, Drawer } from '@mui/material';

interface ATDrawerProps {
  onClose: () => void,
  children: ReactNode,
}

const ATDrawer: FC<ATDrawerProps> = ({ onClose, children }) => (
  <>
    {/* Backdrop to dismiss the sidebar when clicked outside */}
    <Backdrop
      open
      onClick={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1, // Ensure it's above other content
        backgroundColor: 'rgba(0,0,0,0) !important',
      }}
    />
    {/* Drawer positioned on the right with custom width */}
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      sx={{
        'width': '40%',
        'flexShrink': 0,
        '& .MuiDrawer-paper': {
          width: '40%',
          height: '100%',
          top: 0, // Full vertical height
          right: 0, // Position on the right side of the screen
          border: 'none',
          boxShadow: 'none',
          backgroundColor: 'background.paper', // Or any color you prefer
          padding: '16px 25px',
        },
      }}
    >
      <Box
        sx={{
          height: '100%', // Full vertical space
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Drawer>
  </>
);

export default ATDrawer;
