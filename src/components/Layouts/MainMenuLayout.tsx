import React, { useEffect, useState } from 'react';
import {
  NavLink, useLocation, Link, Outlet,
} from 'react-router-dom';
import {
  Inventory, Upload, Help,
  Dashboard, AccountTree, Description, AccountCircle,
  KeyboardDoubleArrowRight, KeyboardDoubleArrowLeft,
} from '@mui/icons-material/';
import {
  Box, Drawer, IconButton, List,
  MenuItem, Typography,
  Breadcrumbs, Divider, ListItemText, ListItemIcon, Tooltip, Grid,
} from '@mui/material';
import { useMsal, useAccount } from '@azure/msal-react';
import styles from './MainMenuLayout.module.css';
import AusTrakkaLogo from '../../assets/logos/AusTrakka_Logo_cmyk.png';
import AusTrakkaLogoSmall from '../../assets/logos/AusTrakka_Logo_only_cmyk.png';
import LogoutButton from '../Common/LogoutButton';

const settings = [
  {
    title: 'Documentation',
    icon: <Description fontSize="small" />,
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
  const breadcrumbNameMap: { [key: string]: any } = {
    projects: 'Projects',
    plots: 'Plots',
    trees: 'Trees',
    records: 'Records',
    versions: 'Versions',
    upload: 'Upload',
    org: 'Organisation',
    sequences: 'Sequences',
    metadata: 'Metadata',
    summary: 'Summary',
    samples: 'Samples',
    proformas: 'ProFormas',
    members: 'Members',
    users: 'Users',
  };
  // These values in the breadcrumb cannot be navigated to
  const breadcrumbNoLink: string[] = ['versions', 'records'];
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

  const handleDrawer = () => {
    setDrawer(!drawer);
    handlePadding(!drawer);
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <Drawer
          open={drawer}
          variant="permanent"
          PaperProps={{
            sx: {
              // backgroundImage: 'linear-gradient(#ffffff, #EEF2F6)',
              boxShadow: '0px 0px 8px #D8D8D8',
              maxWidth: 190,
              minWidth: 70,
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: drawer ? 'row' : 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {drawer ? (<img src={AusTrakkaLogo} alt="logo" className={styles.logo} />) : <img src={AusTrakkaLogoSmall} alt="logo" className={styles.logo} />}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <IconButton
                onClick={() => handleDrawer()}
                aria-label="menu-toggle"
              >
                {drawer ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight /> }
              </IconButton>
            </Box>
          </Box>
          <Divider />
          <List className={styles.pagelist}>
            {pages.map((page) => (
              <NavLink
                key={page.title}
                to={page.link}
                end={page.link === '/'}
                style={({ isActive }) => ({
                  backgroundColor: isActive ? '#dddddd' : '',
                  borderRight: isActive ? 'solid 3px var(--primary-green)' : '',
                  fontWeight: isActive ? 'bold' : '',
                })}
              >
                <Tooltip title={drawer ? '' : page.title} arrow placement="right">
                  <MenuItem
                    key={page.title}
                    sx={{ '&:hover': {
                      backgroundColor: '#dddddd',
                    },
                    'width': '100%' }}
                  >
                    <ListItemIcon sx={{ color: 'primary.main', minWidth: 0, mr: drawer ? 1 : 'auto', justifyContent: 'center' }}>
                      {page.icon}
                    </ListItemIcon>
                    {drawer ? (
                      <ListItemText>
                        {page.title}
                      </ListItemText>
                    )
                      :
                      null}
                  </MenuItem>
                </Tooltip>
              </NavLink>
            ))}
          </List>
          <Divider />
          <Tooltip title={drawer ? username : `${user} - ${username}`} arrow placement="right">
            <Grid container direction="column" alignContent="center" alignItems="center" sx={{ padding: 2 }}>
              <Grid item>
                <AccountCircle color="primary" />
              </Grid>
              {drawer ? (
                <Grid item width="100%" textAlign="center">
                  <Typography noWrap color="primary.main">
                    {user}
                  </Typography>
                </Grid>
              )
                : null}
            </Grid>
          </Tooltip>
          <Divider />
          <List>
            {settings.map((setting) => (
              <MenuItem key={setting.title} disabled>
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 0, mr: drawer ? 1 : 'auto', justifyContent: 'center' }}>
                  {setting.icon}
                </ListItemIcon>
                { drawer ? (
                  <ListItemText>
                    {setting.title}
                  </ListItemText>
                )
                  : null}
              </MenuItem>
            ))}
            <LogoutButton showText={drawer} />
          </List>
        </Drawer>
      </Box>
      <div className={pageStyling}>
        <div className="pageHeader">
          <div className="breadcrumbs">
            <Breadcrumbs aria-label="breadcrumb">
              <Link to="/">
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
