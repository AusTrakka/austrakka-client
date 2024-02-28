import React, { useEffect } from 'react';
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
import ProFormaDetail from './components/ProForma/ProFormaDetail';
import UserDashboard from './components/Dashboards/UserDashboard/UserDashboard';
import OrganisationOverview from './components/OrganisationOverview/OrganisationOverview';
import UploadMetadata from './components/Upload/UploadMetadata';
import UploadSequences from './components/Upload/UploadSequences';
import OrgSampleDetail from './components/SampleDetail/OrgSampleDetail';
import { msalInstance } from './utilities/authUtils';
import UserDetail from './components/Users/UserDetail';
import { useAppDispatch } from './app/store';
import { fetchUserRoles } from './app/userSlice';
import { useApi } from './app/ApiContext';
import LoadingState from './constants/loadingState';
import ProjectSampleDetail from './components/SampleDetail/ProjectSampleDetail';

function App() {
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  msalInstance.setNavigationClient(navigationClient);
  const dispatch = useAppDispatch();
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchUserRoles(token));
    }
  }, [token, tokenLoading, dispatch]);

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
                <Route path="org/:tab" element={<OrganisationOverview />} />
                <Route path="upload" element={<Upload />} />
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
