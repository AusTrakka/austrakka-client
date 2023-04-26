import React from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/en-gb';
import MainMenuLayout from './components/Layouts/MainMenuLayout';
import ProjectsList from './components/ProjectsList/ProjectsList';
import ProjectOverview from './components/ProjectOverview/ProjectOverview';
import Upload from './components/Upload/Upload';
import Login from './components/Login/Login';
import theme from './assets/themes/theme';
import PlotDetail from './components/Plots/PlotDetail';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <AuthenticatedTemplate>
          <Routes>
            <Route path="/" element={<Navigate to="/projects" />} />
            <Route path="/dashboard" element={<Navigate to="/projects" />} />
            <Route element={<MainMenuLayout />}>
              <Route path="/upload" element={<Upload />} />
              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/projects/:projectAbbrev" element={<ProjectOverview />} />
              <Route path="/projects/:projectAbbrev/plots/:plotAbbrev" element={<PlotDetail/>}/>
            </Route>
            <Route path="*" element={<Navigate to="/projects" />} />
          </Routes>
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
