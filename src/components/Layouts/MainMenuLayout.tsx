import {
  AccountCircle,
  AccountTree,
  Dashboard,
  Description,
  Domain,
  Help,
  Inventory,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  People,
  Terminal,
  Upload,
  ViewColumn,
} from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { selectUserState, type UserSliceState } from '../../app/userSlice';
import { Theme } from '../../assets/themes/theme';
import { logoOnlyUrl, logoUrl } from '../../constants/logoPaths';
import { hasPermissionV2ByRole } from '../../permissions/accessTable';
import { RoleV2SeededName } from '../../permissions/roles';
import Cli from '../Cli/Cli';
import LogoutButton from '../Common/LogoutButton';
import Feedback from '../Feedback/Feedback';
import { ORG_TABS } from '../OrganisationOverview/orgTabConstants';
import { PROJ_TABS } from '../ProjectOverview/projTabConstants';
import styles from './MainMenuLayout.module.css';

interface SideBarItemProps {
  title: string;
  link: string;
  icon: React.ReactNode;
  permissionDomain?: string;
}

function MainMenuLayout() {
  const navigate = useNavigate();
  const [pageStyling, updatePageStyling] = useState('pagePadded');
  const [warningBanner, updateWarningBanner] = useState('warningBannerPadded');
  const [drawer, setDrawer] = useState(true);
  const [help, setHelp] = useState(false);
  const [cli, setCli] = useState(false);
  const settings = [
    {
      title: 'Documentation',
      icon: <Description fontSize="small" />,
      onClick: () => {
        window.open(`${import.meta.env.VITE_DOCS_URL}`, '_blank')?.focus();
      },
    },
    {
      title: 'CLI',
      icon: <Terminal fontSize="small" />,
      disabled: false,
      onClick: () => setCli((prev) => !prev),
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
    trees: 'Trees',
    records: 'Records',
    versions: 'Versions',
    upload: 'Upload',
    org: 'Organisation',
    sequences: 'Sequences',
    metadata: 'Metadata',
    dashboard: 'Dashboard',
    proformas: 'Proformas',
    members: 'Members',
    users: 'Users',
    usersV2: 'Users (V2)',
    platform: 'Platform',
    fields: 'Fields',
    datasets: 'Datasets',
    share: 'Share',
    documents: 'Documents',
    plots: 'Plots',
    map: 'Map',
  };

  const breadcrumbNoLink: string[] = ['versions', 'records', 'org'];

  /**
   * The proj tab breadcrumbs are not working as we cannot access the underlying state of the url
   * to determine which tab we are on. This was done as when react router dom updated it cause each
   * use navigate call to re-render the page.
   * This was ulitmately was not performant and was removed.
   * The project tabs can only be routed through bread crumbs when they are not the leaf node.
   */

  const noBreadCrumbIfLast: string[] = [
    'dashboard',
    'samples',
    'trees',
    'plots',
    'members',
    'proformas',
    'datasets',
    'activity',
    'documents',
  ];

  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const lastPath = pathnames.at(-1) ?? '';
  const validTabKeys = new Set([...Object.keys(PROJ_TABS), ...Object.keys(ORG_TABS)]);

  const isShortPath = pathnames.length > 0 && pathnames.length <= 3;
  const isNoBreadcrumbItem = noBreadCrumbIfLast.some((item) => lastPath.endsWith(item));
  const isProjectOrOrg = pathnames[0] === 'projects' || pathnames[0] === 'org';
  const isUnknownTab = isProjectOrOrg && !validTabKeys.has(lastPath);

  if (isShortPath && (isNoBreadcrumbItem || isUnknownTab) && isProjectOrOrg) {
    pathnames.pop();
  }

  const user: UserSliceState = useAppSelector(selectUserState);
  const pages: SideBarItemProps[] = [
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
      title: 'Platform',
      link: '/platform',
      icon: <Domain />,
      permissionDomain: 'tenantPlatform',
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

  const hasAdminRights: boolean = hasPermissionV2ByRole(user, RoleV2SeededName.Admin);

  const visiblePages = pages.filter((page) => !page.permissionDomain || hasAdminRights);

  const showSidebarBrandingName = (): boolean =>
    import.meta.env.VITE_BRANDING_SIDEBAR_NAME_ENABLED === 'true';
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: drawer ? 'row' : 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }} onClick={() => navigate('/')}>
              {drawer ? (
                <img src={logoUrl} alt="logo" className={styles.logo} />
              ) : (
                <img src={logoOnlyUrl} alt="logo" className={styles.logo} />
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <IconButton onClick={() => handleDrawer()} aria-label="menu-toggle">
                {drawer ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight />}
              </IconButton>
            </Box>
          </Box>
          {drawer && showSidebarBrandingName() && (
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
          )}
          <Divider />
          <List className={styles.pagelist}>
            {visiblePages.map((page) => (
              <React.Fragment key={page.title}>
                <NavLink
                  key={page.title}
                  to={page.link}
                  end={page.link === '/'}
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? Theme.PrimaryGrey300 : '',
                    borderRight: isActive ? 'solid 3px var(--secondary-main)' : '',
                    fontWeight: isActive ? 'bold' : '',
                  })}
                >
                  <Tooltip title={drawer ? '' : page.title} arrow placement="right">
                    <MenuItem
                      key={page.title}
                      sx={{
                        '&:hover': {
                          backgroundColor: Theme.PrimaryGrey300,
                        },
                        width: '100%',
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
          <Link to={`/users/${user.username}`} style={{ textDecoration: 'none' }}>
            <Tooltip
              title={drawer ? user.username : `${user.displayName} - ${user.username}`}
              arrow
              placement="right"
            >
              <Grid
                container
                direction="column"
                alignContent="center"
                alignItems="center"
                sx={{ padding: 2 }}
              >
                <Grid item>
                  <IconButton color="primary">
                    <AccountCircle />
                  </IconButton>
                </Grid>
                {drawer ? (
                  <Grid item width="100%" textAlign="center">
                    <Typography noWrap color="primary.main">
                      {user.displayName}
                    </Typography>
                  </Grid>
                ) : null}
              </Grid>
            </Tooltip>
          </Link>
          <Divider />
          <List>
            {settings.map((setting) => (
              <MenuItem key={setting.title} disabled={setting.disabled} onClick={setting.onClick}>
                <ListItemIcon
                  sx={{
                    color: 'primary.main',
                    minWidth: 0,
                    mr: drawer ? 1 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {setting.icon}
                </ListItemIcon>
                {drawer ? (
                  <ListItemText sx={{ color: 'primary.main' }}>{setting.title}</ListItemText>
                ) : null}
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
            This is the new user interface with an in-progress permissions system. Not all new roles
            have been implemented.
          </Typography>
        </div>
      ) : null}
      <div className={pageStyling}>
        <div className="pageHeader">
          <div className="breadcrumbs">
            <Breadcrumbs aria-label="breadcrumb">
              <Link to="/">Home</Link>
              {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const nolink = breadcrumbNoLink.includes(value);
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const displayValue = value in breadcrumbNameMap ? breadcrumbNameMap[value] : value;

                return last || nolink ? (
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
        {pathnames.map((_value, index) => {
          const last: boolean = index === pathnames.length - 1;
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
      <Cli cli={cli} handleHelpClose={() => setCli(!cli)} />
    </>
  );
}

export default MainMenuLayout;
