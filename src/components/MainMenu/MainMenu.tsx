import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, NavLink} from 'react-router-dom'
import { AppBar, Box, Button, CssBaseline, Drawer, Icon, IconButton, List, ListItem, Toolbar, Menu, MenuItem } from "@mui/material"
import { Inventory, Upload, AccountCircle } from '@mui/icons-material/';
import MenuIcon from '@mui/icons-material/Menu';
import AusTrakkaLogo from '../../assests/logos/AusTrakka_logo_white.png'
import styles from "./MainMenu.module.css"

const settings = [
  {
    "title" : "Help",
  },
  {
    "title" : "Logout",
  }
]

const pages = [
  {
    "title" : "Projects",
    "link" : "/projects",
    "icon" : <><Inventory /></>
  },
  {
    "title" : "Upload",
    "link" : "/upload",
    "icon" : <><Upload /></>
  }
]

interface FuncProps {
  handlePadding(arg: boolean): void;
}

//TODO: Update padding in parent components
//TODO: What happens when page is switched?

const MainMenu: React.FC<FuncProps> = (props) => {
    const [drawer, setDrawer] = useState(true);
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
      setAnchor(event.currentTarget);
    };

    const handleMenuClose = (event: React.MouseEvent<HTMLElement>) => {
      setAnchor(null);
    };

    const handleDrawer = () => {
      setDrawer(!drawer);
      props.handlePadding(!drawer)
    };

    return (
        <Box sx={{display: "flex"}}>
          <AppBar className={styles.appbar}>
            <Toolbar className={styles.toolbar}>
              <IconButton
                  onClick = {() => handleDrawer()} 
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu-toggle"
              >
                <MenuIcon/>
              </IconButton>
              <div className={styles.logocontainer}>
                <img src={AusTrakkaLogo} alt="logo" className={styles.logo}/>
              </div>
              {/* TODO: Button below to be replaced with a profile icon and menu */}
              <Button href="/" variant="text" color="inherit">Logout</Button>

              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchor}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchor)}
                  onClose={handleMenuClose}
                >
                  {settings.map((setting) =>(
                    <MenuItem key={setting.title} onClick={handleMenuClose}>{setting.title}</MenuItem>
                  ))}
                </Menu>
            </Toolbar>
          </AppBar>
          <Drawer 
            open={drawer} 
            variant="persistent"

            className={styles.drawer}
            classes={{
              paper: styles.drawerpaper,
              docked: styles.drawer
            }}
          >
            <Toolbar /> {/*For spacing*/}
            <List className={styles.pagelist} >
              {pages.map((page) =>(
                <ListItem key={page.title}>
                  <NavLink to={page.link}>
                  {page.icon} &nbsp; {page.title}
                  </NavLink>
                </ListItem>
              ))}
            </List>
          </Drawer>
        <Box sx={{flexGrow: 1}}>
          <Toolbar/> {/*For spacing*/}
        </Box>
      </Box>
    )
  }
  export default MainMenu;