import React, { useEffect, useState } from 'react';
import {
  NavLink, useLocation, Link, Outlet,
} from 'react-router-dom';
import {
  Inventory, Upload, AccountCircle, Help, MoreVert, Dashboard, AccountTree,
} from '@mui/icons-material/';
import {
  AppBar, Box, Drawer, IconButton, List,
  ListItem, Toolbar, Menu, MenuItem, Typography,
  Breadcrumbs, Divider, ListItemText, ListItemIcon, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { useMsal, useAccount } from '@azure/msal-react';
import styles from './MainMenuLayout.module.css';
import AusTrakkaLogo from '../../assets/logos/AusTrakka_Logo_white.png';
import LogoutButton from '../Common/LogoutButton';

const settings = [
  {
    title: 'Profile',
    icon: <AccountCircle fontSize="small" />,
  },
  {
    title: 'Help',
    icon: <Help fontSize="small" />,
  },
];

const pages = [
  {
    title: 'Dashboard',
    link: '/',
    icon: <Dashboard />,
  },
  {
    title: 'Projects',
    link: '/projects',
    icon: <Inventory />,
  },
  {
    title: 'Organisation',
    link: '/org',
    icon: <AccountTree />,
  },
  {
    title: 'Upload',
    link: '/upload',
    icon: <Upload />,
  },
];

function MainMenuLayout() {
  const [pageStyling, updatePageStyling] = useState('pagePadded');
  const [drawer, setDrawer] = useState(true);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const breadcrumbNameMap: { [key: string]: any } = {
    projects: 'Projects',
    plots: 'Plots',
    trees: 'Trees',
    records: 'Records',
    versions: 'Versions',
    upload: 'Upload',
    org: 'Organisation Data',
  };
  // These values in the breadcrumb cannot be navigated to
  const breadcrumbNoLink: string[] = ['plots', 'trees', 'analyses', 'versions', 'records'];
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const [username, setUsername] = useState('');
  const [user, setUser] = useState('');
  const { accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  useEffect(() => {
    if (account && account.name && account.username) {
      setUser(account.name);
      setUsername(account.username);
    }
  }, [account]);

  const handlePadding = (drawerState: boolean | undefined) => {
    if (drawerState === true) {
      updatePageStyling('pagePadded');
    } else {
      updatePageStyling('page');
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchor(null);
  };

  const handleDrawer = () => {
    setDrawer(!drawer);
    handlePadding(!drawer);
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <AppBar className={styles.appbar}>
          <Toolbar variant="dense">
            <IconButton
              onClick={() => handleDrawer()}
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu-toggle"
            >
              <MenuIcon />
            </IconButton>
            <div className={styles.logocontainer}>
              <img src={AusTrakkaLogo} alt="logo" className={styles.logo} />
            </div>
            <Tooltip title={username}>
              <Typography>{user}</Typography>
            </Tooltip>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <MoreVert />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchor}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchor)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  'overflow': 'visible',
                  'filter': 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  'mt': 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
            >
              {settings.map((setting) => (
                <MenuItem key={setting.title} onClick={handleMenuClose} disabled>
                  <ListItemIcon>
                    {setting.icon}
                  </ListItemIcon>
                  <ListItemText>
                    {setting.title}
                  </ListItemText>
                </MenuItem>
              ))}
              <Divider />
              <LogoutButton />
            </Menu>
          </Toolbar>
        </AppBar>
        <Drawer
          open={drawer}
          variant="persistent"
          className={styles.drawer}
          classes={{
            paper: styles.drawerpaper,
            docked: styles.drawer,
          }}
        >
          <Toolbar variant="dense" />
          {' '}
          {/* For spacing */}
          <List className={styles.pagelist}>
            {pages.map((page) => (
              <ListItem key={page.title}>
                <NavLink to={page.link}>
                  {page.icon}
                  {' '}
&nbsp;
                  {page.title}
                </NavLink>
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Box sx={{ flexGrow: 1 }}>
          <Toolbar variant="dense" />
          {' '}
          {/* For spacing */}
        </Box>
      </Box>
      <div className={pageStyling}>
        <div className="pageHeader">
          <div className="breadcrumbs">
            <Breadcrumbs aria-label="breadcrumb">
              <Link color="inherit" to="/">
                Home
              </Link>
              {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const nolink = breadcrumbNoLink.includes(value);
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const displayValue = value in breadcrumbNameMap ? breadcrumbNameMap[value] : value;

                return (last || nolink) ? (
                  <Typography color="text.primary" key={to}>
                    {displayValue}
                  </Typography>
                ) : (
                  <Link color="inherit" to={to} key={to}>
                    {displayValue}
                  </Link>
                );
              })}
            </Breadcrumbs>
          </div>
        </div>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          return last ? (
            <Typography className="pageTitle" key={to}>
              {breadcrumbNameMap[to]}
            </Typography>
          ) : null;
        })}
        <Outlet />
      </div>
    </>
  );
}

export default MainMenuLayout;
