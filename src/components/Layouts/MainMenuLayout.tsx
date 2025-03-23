/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import {
  NavLink, useLocation, Link, Outlet, useNavigate,
} from 'react-router-dom';
import {
  Inventory, Upload, Help,
  Dashboard, AccountTree, Description, AccountCircle,
  KeyboardDoubleArrowRight, KeyboardDoubleArrowLeft, People, ViewColumn,
} from '@mui/icons-material';
import {
  Box, Drawer, IconButton, List,
  MenuItem, Typography,
  Breadcrumbs, Divider, ListItemText, ListItemIcon, Tooltip, Grid,
} from '@mui/material';
import { useMsal, useAccount } from '@azure/msal-react';
import styles from './MainMenuLayout.module.css';
import LogoutButton from '../Common/LogoutButton';
import { useAppSelector } from '../../app/store';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { PermissionLevel, hasPermission } from '../../permissions/accessTable';
import Feedback from '../Feedback/Feedback';
import { logoOnlyUrl, logoUrl } from '../../constants/logoPaths';

function MainMenuLayout() {
  const navigate = useNavigate();
  const [pageStyling, updatePageStyling] = useState('pagePadded');
  const [warningBanner, updateWarningBanner] = useState('warningBannerPadded');
  const [drawer, setDrawer] = useState(true);
  const [help, setHelp] = useState(false);
  const settings = [
    {
      title: 'Documentation',
      icon: <Description fontSize="small" />,
      disabled: import.meta.env.VITE_DOCS_ENABLED === 'false',
      onClick: () => {
        window.open(import.meta.env.VITE_DOCS_URL, '_blank')?.focus();
      },
    },
    {
      title: 'Support',
      icon: <Help fontSize="small" />,
      disabled: false,
      onClick: () => setHelp((prev) => !prev),
    },
  ];
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
    usersV2: 'Users (V2)',
    fields: 'Fields',
    datasets: 'Datasets',
  };

  const breadcrumbNoLink: string[] = ['versions', 'records'];

  /**
   * The proj tab breadcrumbs are not working as we cannot access the underlying state of the url
   * to determine which tab we are on. This was done as when react router dom updated it cause each
   * use navigate call to re-render the page.
   * This was ulitmately was not performant and was removed.
   * The project tabs can only be routed through bread crumbs when they are not the leaf node.
   */

  const noBreadCrumbIfLast: string[] =
    ['summary', 'samples', 'trees', 'plots', 'members', 'proformas', 'datasets'];
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // when on a users detail page, do not show objectID that appears in URL
  if (pathnames.length > 1 && pathnames[0] === 'users') {
    pathnames[1] = '';
  }

  if (pathnames.length > 0 && pathnames.length <= 3 &&
      noBreadCrumbIfLast.some(item => pathnames[pathnames.length - 1].endsWith(item))
      && (pathnames[0] === 'projects' || pathnames[0] === 'org')) {
    pathnames.pop();
  }

  const [username, setUsername] = useState('');
  const { accounts } = useMsal();

  const account = useAccount(accounts[0] || {});
  const user: UserSliceState = useAppSelector(selectUserState);
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
      link: `/org/${user.orgAbbrev}`,
      icon: <AccountTree />,
    },
    {
      title: 'Upload',
      link: '/upload',
      icon: <Upload />,
    },
    {
      title: 'Fields',
      link: '/fields',
      icon: <ViewColumn />,
    },
    {
      title: 'Users',
      link: '/users',
      icon: <People />,
      permissionDomain: 'users',
    },
    {
      title: 'Users (V2)',
      link: '/usersV2',
      icon: <People color="warning" />,
      permissionDomain: 'usersV2',
    },
  ];
  const visiblePages = pages.filter((page) =>
    !page.permissionDomain || hasPermission(
      user,
      'AusTrakka-Owner',
      page.permissionDomain,
      PermissionLevel.CanShow,
    ));

  const showSidebarBrandingName = (): boolean => import.meta.env.VITE_BRANDING_SIDEBAR_NAME_ENABLED === 'true';

  useEffect(() => {
    if (account && account.username) {
      setUsername(account.username); // seems to be login email
    }
  }, [account]);

  const handlePadding = (drawerState: boolean | undefined) => {
    if (drawerState === true) {
      updatePageStyling('pagePadded');
      updateWarningBanner('warningBannerPadded');
    } else {
      updatePageStyling('page');
      updateWarningBanner('warningBanner');
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
              boxShadow: '0px 0px 8px var(--primary-grey-300)',
              maxWidth: 190,
              minWidth: 70,
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: drawer ? 'row' : 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }} onClick={() => navigate('/')}>
              {drawer ? (<img src={logoUrl} alt="logo" className={styles.logo} />) : <img src={logoOnlyUrl} alt="logo" className={styles.logo} />}
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
          {
            drawer && showSidebarBrandingName() && (
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: '800',
              }}
            >
              {import.meta.env.VITE_BRANDING_NAME}
            </Typography>
            )
}
          <Divider />
          <List className={styles.pagelist}>
            {visiblePages.map((page) => (
              <React.Fragment key={page.title}>
                <NavLink
                  key={page.title}
                  to={page.link}
                  end={page.link === '/'}
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--primary-grey-300)' : '',
                    borderRight: isActive ? 'solid 3px var(--secondary-main)' : '',
                    fontWeight: isActive ? 'bold' : '',
                  })}
                >
                  <Tooltip
                    title={drawer ? '' : page.title}
                    arrow
                    placement="right"
                  >
                    <MenuItem
                      key={page.title}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'var(--primary-grey-300)',
                        },
                        'width': '100%',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: 'primary.main',
                          minWidth: 0,
                          mr: drawer ? 1 : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {page.icon}
                      </ListItemIcon>
                      {drawer ? <ListItemText>{page.title}</ListItemText> : null}
                    </MenuItem>
                  </Tooltip>
                </NavLink>
              </React.Fragment>
            ))}
          </List>
          <Divider />
          <Tooltip title={drawer ? username : `${user.displayName} - ${username}`} arrow placement="right">
            <Grid container direction="column" alignContent="center" alignItems="center" sx={{ padding: 2 }}>
              <Grid item>
                <AccountCircle color="primary" />
              </Grid>
              {drawer ? (
                <Grid item width="100%" textAlign="center">
                  <Typography noWrap color="primary.main">
                    {user.displayName}
                  </Typography>
                </Grid>
              )
                : null}
            </Grid>
          </Tooltip>
          <Divider />
          <List>
            {settings.map((setting) => (
              <MenuItem key={setting.title} disabled={setting.disabled} onClick={setting.onClick}>
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 0, mr: drawer ? 1 : 'auto', justifyContent: 'center' }}>
                  {setting.icon}
                </ListItemIcon>
                { drawer ? (
                  <ListItemText sx={{ color: 'primary.main' }}>
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
      {pathnames.includes('usersV2') ? (
        <div className={warningBanner}>
          <Typography
            variant="body2"
            style={{
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '10px',
            }}
          >
            This is the new user interface with an in-progress permissions system.
            Not all new roles have been implemented.
          </Typography>
        </div>
      ) : null}
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
      <Feedback help={help} handleHelpClose={() => setHelp(!help)} location={location} />
    </>
  );
}

export default MainMenuLayout;
