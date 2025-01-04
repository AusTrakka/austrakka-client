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
import UsersV2 from './components/Admin/UsersV2';
import UserDetailV2 from './components/UsersV2/BasicDetails/UserDetailV2';
import UserProvider from './app/UserProvider';
import Platform from './components/Platform/Platform';

function App() {
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  msalInstance.setNavigationClient(navigationClient);
  
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <UserProvider>
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
                  <Route path="platform" element={<Platform />} />
                  <Route path="platform/:tab" element={<Platform />} />
                  <Route path="upload" element={<Upload />} />
                  <Route path="users" element={<Users />} />
                  <Route path="usersV2" element={<UsersV2 />} />
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
                  <Route path="usersV2/:userGlobalId" element={<UserDetailV2 />} />
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
        </UserProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
