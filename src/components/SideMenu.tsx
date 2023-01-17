import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, NavLink} from 'react-router-dom'
import {
    AppBar,
    Box,
    Button,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    Toolbar, Typography
} from "@mui/material"
import MenuIcon from '@mui/icons-material/Menu';

const SideMenu = () => {
    const [sidebar, setSidebar] = useState(true);
    return (
        <Box className="App" sx={{display: "flex"}}>
        <CssBaseline />
          <AppBar position="fixed" >
            <Toolbar>
              <IconButton
                  onClick = {() => setSidebar(!sidebar)} 
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu-toggle"
                  sx={{ mr: 2 }} 
              >
                <MenuIcon/>
              </IconButton>
              <Typography>AusTrakka</Typography>
            </Toolbar>
          </AppBar>
        <Drawer 
            open={sidebar} 
            variant="persistent" 
            sx={{width: 120, flexShrink: 0, zIndex: 10 }}>
          <Toolbar /> {/*For spacing*/}
          <List>
            <ListItem key="projects">
              <NavLink to="/projects">
                  Projects
              </NavLink>
            </ListItem>
            <ListItem key="upload">
              <NavLink to="/upload">
                  Upload
              </NavLink>
            </ListItem>
          </List>
        </Drawer>
        <Box sx={{flexGrow: 1}}>
          <Toolbar/> {/*For spacing*/}
        </Box>
      </Box>
    )
  }
  export default SideMenu;