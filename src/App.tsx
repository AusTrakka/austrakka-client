import React from 'react';
import './App.css';
import './assets/themes/custom-style.css';
import {
  Routes, Route, Navigate, useNavigate,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/en-gb';
import MainMenuLayout from './components/Layouts/MainMenuLayout';
import ProjectsList from './components/ProjectsList/ProjectsList';
import ProjectOverview from './components/ProjectOverview/ProjectOverview';
import Upload from './components/Upload/Upload';
import theme from './assets/themes/theme';
import PlotDetail from './components/Plots/PlotDetail';
import TreeDetail from './components/Trees/TreeDetail';
import UploadMetadata from './components/Upload/UploadMetadata';
import ProjectSampleDetail from './components/SampleDetail/ProjectSampleDetail';
import Fields from './components/Fields/Fields';
import UserProvider from './providers/UserProvider';
import TenantProvider from './providers/TenantProvider';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <TenantProvider>
          <UserProvider>
            <Routes>
              {/* <Route path="dashboard" element={<Navigate to="projects" />} /> */}
              <Route element={<MainMenuLayout />}>
                <Route path="/" element={<ProjectsList />} />
                // TODO
                <Route path="upload" element={<Upload />} />
                <Route path="upload/metadata" element={<UploadMetadata />} />
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/:projectAbbrev/plots/:plotAbbrev" element={<PlotDetail />} />
                <Route path="projects/:projectAbbrev/trees/:analysisId/versions/:jobInstanceId" element={<TreeDetail />} />
                <Route path="projects/:projectAbbrev/records/:seqId" element={<ProjectSampleDetail />} />
                <Route path="projects/:projectAbbrev/:tab" element={<ProjectOverview />} />
                <Route path="projects/:projectAbbrev" element={<ProjectOverview />} />
                <Route path="fields" element={<Fields />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </UserProvider>
        </TenantProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
