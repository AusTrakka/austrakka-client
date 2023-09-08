import React from 'react';
import './App.css';
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
import SampleDetail from './components/SampleDetail/SampleDetail';
import UserDashboard from './components/Dashboards/UserDashboard/UserDashboard';
import OrganisationOverview from './components/OrganisationOverview/OrganisationOverview';
import UploadMetadata from './components/Upload/UploadMetadata';
import UploadSequences from './components/Upload/UploadSequences';
import { msalInstance } from './utilities/authUtils';

function App() {
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  msalInstance.setNavigationClient(navigationClient);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <AuthenticatedTemplate>
          <MsalAuthenticationTemplate
            interactionType={InteractionType.Redirect}
          >
            <Routes>
              {/* <Route path="dashboard" element={<Navigate to="projects" />} /> */}
              <Route element={<MainMenuLayout />}>
                <Route path="/" element={<UserDashboard />} />
                <Route path="org" element={<OrganisationOverview />} />
                <Route path="upload" element={<Upload />} />
                <Route path="upload/metadata" element={<UploadMetadata />} />
                <Route path="upload/sequences" element={<UploadSequences />} />
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/:projectAbbrev" element={<ProjectOverview />} />
                <Route path="projects/:projectAbbrev/plots/:plotAbbrev" element={<PlotDetail />} />
                <Route path="projects/:projectAbbrev/trees/:analysisId/versions/:jobInstanceId" element={<TreeDetail />} />
                <Route path="projects/:projectAbbrev/records/:seqId" element={<SampleDetail />} />
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
