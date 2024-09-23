import React from 'react';
import './App.css';
import './assets/themes/custom-style.css';
import {
  Routes, Route, Navigate, useNavigate,
} from 'react-router-dom';
import {
  AuthenticatedTemplate, UnauthenticatedTemplate, MsalAuthenticationTemplate,
} from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/en-gb';
import CustomNavigationClient from './utilities/NavigationClient';
import MainMenuLayout from './components/Layouts/MainMenuLayout';
import ProjectsList from './components/ProjectsList/ProjectsList';
import ProjectOverview from './components/ProjectOverview/ProjectOverview';
import Upload from './components/Upload/Upload';
import Login from './components/Login/Login';
import theme from './assets/themes/theme';
import PlotDetail from './components/Plots/PlotDetail';
import TreeDetail from './components/Trees/TreeDetail';
import ProFormaDetail from './components/ProForma/ProFormaDetail';
import UserDashboard from './components/Dashboards/UserDashboard/UserDashboard';
import OrganisationOverview from './components/OrganisationOverview/OrganisationOverview';
import UploadMetadata from './components/Upload/UploadMetadata';
import UploadSequences from './components/Upload/UploadSequences';
import OrgSampleDetail from './components/SampleDetail/OrgSampleDetail';
import { msalInstance } from './utilities/authUtils';
import UserDetail from './components/Users/UserDetail';
import ProjectSampleDetail from './components/SampleDetail/ProjectSampleDetail';
import Users from './components/Admin/Users';
import Fields from './components/Fields/Fields';
import { GlobalStyles } from '@mui/material';

function App() {
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  msalInstance.setNavigationClient(navigationClient);
  const globalStyles = {
    ':root': {
      // material-ui
      '--primary-blue': import.meta.env.VITE_THEME_PRIMARY_BLUE_HEX,
      '--primary-green': import.meta.env.VITE_THEME_PRIMARY_GREEN_HEX,
      '--primary-grey': import.meta.env.VITE_THEME_PRIMARY_GREY_HEX,
      '--secondary-dark-grey': import.meta.env.VITE_THEME_SECONDARY_DARK_GREY_HEX,
      '--secondary-light-grey': import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREY_HEX,
      '--secondary-teal': import.meta.env.VITE_THEME_SECONDARY_TEAL_HEX,
      '--secondary-light-green': import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREEN_HEX,
      '--secondary-dark-green': import.meta.env.VITE_THEME_SECONDARY_DARK_GREEN_HEX,
      '--secondary-blue': import.meta.env.VITE_THEME_SECONDARY_BLUE_HEX,
      '--secondary-purple': import.meta.env.VITE_THEME_SECONDARY_PURPLE_HEX,
      '--secondary-orange': import.meta.env.VITE_THEME_SECONDARY_ORANGE_HEX,
      '--secondary-red': import.meta.env.VITE_THEME_SECONDARY_RED_HEX,
      '--secondary-yellow': import.meta.env.VITE_THEME_SECONDARY_YELLOW_HEX,
      'color-scheme': import.meta.env.VITE_THEME_BACKGROUND_HEX,
      // primereact
      '--primary-50': import.meta.env.VITE_THEME_PRIMARY_GREEN_50_HEX,
      '--primary-100': import.meta.env.VITE_THEME_PRIMARY_GREEN_100_HEX,
      '--primary-200': import.meta.env.VITE_THEME_PRIMARY_GREEN_200_HEX,
      '--primary-300': import.meta.env.VITE_THEME_PRIMARY_GREEN_300_HEX,
      '--primary-400': import.meta.env.VITE_THEME_PRIMARY_GREEN_400_HEX,
      '--primary-500': import.meta.env.VITE_THEME_PRIMARY_GREEN_500_HEX,
      '--primary-600': import.meta.env.VITE_THEME_PRIMARY_GREEN_600_HEX,
      '--primary-700': import.meta.env.VITE_THEME_PRIMARY_GREEN_700_HEX,
      '--primary-800': import.meta.env.VITE_THEME_PRIMARY_GREEN_800_HEX,
      '--primary-900': import.meta.env.VITE_THEME_PRIMARY_GREEN_900_HEX,
    },
  }
  
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={globalStyles}></GlobalStyles>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <AuthenticatedTemplate>
          <MsalAuthenticationTemplate
            interactionType={InteractionType.Redirect}
          >
            <Routes>
              {/* <Route path="dashboard" element={<Navigate to="projects" />} /> */}
              <Route element={<MainMenuLayout />}>
                <Route path="/" element={<UserDashboard />} />
                <Route path="org/:orgAbbrev" element={<OrganisationOverview />} />
                <Route path="org/:orgAbbrev/:tab" element={<OrganisationOverview />} />
                <Route path="upload" element={<Upload />} />
                <Route path="users" element={<Users />} />
                <Route path="upload/metadata" element={<UploadMetadata />} />
                <Route path="upload/sequences" element={<UploadSequences />} />
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/:projectAbbrev/plots/:plotAbbrev" element={<PlotDetail />} />
                <Route path="projects/:projectAbbrev/trees/:analysisId/versions/:jobInstanceId" element={<TreeDetail />} />
                <Route path="projects/:projectAbbrev/records/:seqId" element={<ProjectSampleDetail />} />
                <Route path="projects/:projectAbbrev/:tab" element={<ProjectOverview />} />
                <Route path="projects/:projectAbbrev" element={<ProjectOverview />} />
                <Route path="records/:seqId" element={<OrgSampleDetail />} />
                <Route path="proformas/:proformaAbbrev" element={<ProFormaDetail />} />
                <Route path="fields" element={<Fields />} />
                <Route path="users/:userObjectId" element={<UserDetail />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </MsalAuthenticationTemplate>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        </UnauthenticatedTemplate>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
