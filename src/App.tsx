import React from 'react';
import './App.css';
import './assets/themes/custom-style.css';
import {
  Routes, Route, Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/en-gb';
import MainMenuLayout from './components/Layouts/MainMenuLayout';
import ProjectOverview from './components/ProjectOverview/ProjectOverview';
import theme from './assets/themes/theme';
import PlotDetail from './components/Plots/PlotDetail';
import TreeDetail from './components/Trees/TreeDetail';
import LocalUpload from './components/Upload/LocalUpload';
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
                <Route path="/" element={<LocalUpload />} />
                <Route path="upload" element={<LocalUpload />} />
                <Route path="data/plots/:plotType" element={<PlotDetail />} />
                <Route path="data/trees/:treeId" element={<TreeDetail />} />
                <Route path="data/records/:seqId" element={<ProjectSampleDetail />} />
                <Route path="data/:tab" element={<ProjectOverview />} />
                <Route path="data" element={<ProjectOverview />} />
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
