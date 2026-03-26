import './App.css';
import './assets/themes/custom-style.css';
import { InteractionType } from '@azure/msal-browser';
import {
  AuthenticatedTemplate,
  MsalAuthenticationTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import 'dayjs/locale/en-gb';
import muiTheme from './assets/themes/theme';
import Users from './components/Admin/Users';
import UsersV2 from './components/Admin/UsersV2';
import UserDashboard from './components/Dashboards/UserDashboard/UserDashboard';
import Fields from './components/Fields/Fields';
import MainMenuLayout from './components/Layouts/MainMenuLayout';
import Login from './components/Login/Login';
import MapPage from './components/Maps/MapPage';
import OrganisationOverviewWrapper from './components/OrganisationOverview/OrganisationOverview';
import Platform from './components/Platform/Platform';
import PlotDetail from './components/Plots/PlotDetail';
import ProFormaDetail from './components/ProForma/ProFormaDetail';
import ProjectOverviewWrapper from './components/ProjectOverview/ProjectOverview';
import ProjectsList from './components/ProjectsList/ProjectsList';
import OrgSampleDetail from './components/SampleDetail/OrgSampleDetail';
import ProjectSampleDetail from './components/SampleDetail/ProjectSampleDetail';
import TreeDetail from './components/Trees/TreeDetail';
import Upload from './components/Upload/Upload';
import UploadMetadata from './components/Upload/UploadMetadata';
import UploadSequences from './components/Upload/UploadSequences';
import UserDetail from './components/Users/UserDetail';
import UserV2DetailOverview from './components/UsersV2/MainViews/UserV2DetailOverview';
import UserProvider from './providers/UserProvider';
import { msalInstance } from './utilities/authUtils';
import CustomNavigationClient from './utilities/NavigationClient';

function App() {
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  msalInstance.setNavigationClient(navigationClient);

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <UserProvider>
          <AuthenticatedTemplate>
            <MsalAuthenticationTemplate interactionType={InteractionType.Redirect}>
              <Routes>
                {/* <Route path="dashboard" element={<Navigate to="projects" />} /> */}
                <Route element={<MainMenuLayout />}>
                  <Route path="/" element={<UserDashboard />} />
                  <Route path="platform/:tab?" element={<Platform />} />
                  <Route path="org/:orgAbbrev/:tab?" element={<OrganisationOverviewWrapper />} />
                  <Route path="upload" element={<Upload />} />
                  <Route path="users" element={<Users />} />
                  <Route path="usersV2" element={<UsersV2 />} />
                  <Route path="upload/metadata" element={<UploadMetadata />} />
                  <Route path="upload/sequences" element={<UploadSequences />} />
                  <Route path="projects" element={<ProjectsList />} />
                  <Route
                    path="projects/:projectAbbrev/plots/:plotAbbrev"
                    element={<PlotDetail />}
                  />
                  <Route
                    path="projects/:projectAbbrev/trees/:treeId/versions/:treeVersionId"
                    element={<TreeDetail />}
                  />
                  <Route
                    path="projects/:projectAbbrev/records/:seqId"
                    element={<ProjectSampleDetail />}
                  />
                  <Route
                    path="projects/:projectAbbrev/:tab?"
                    element={<ProjectOverviewWrapper />}
                  />
                  <Route path="projects/:projectAbbrev/map" element={<MapPage />} />
                  <Route path="records/:seqId" element={<OrgSampleDetail />} />
                  <Route path="proformas/:proformaAbbrev" element={<ProFormaDetail />} />
                  <Route path="fields" element={<Fields />} />
                  <Route path="users/:username" element={<UserDetail />} />
                  <Route path="usersV2/:username" element={<UserV2DetailOverview />} />
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
