import './App.css';
import './assets/themes/custom-style.css';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Navigate, Route, Routes } from 'react-router-dom';
import 'dayjs/locale/en-gb';
import muiTheme from './assets/themes/theme';
import MainMenuLayout from './components/Layouts/MainMenuLayout';
import MapPage from './components/Maps/MapPage';
import PlotDetail from './components/Plots/PlotDetail';
import ProjectOverview from './components/ProjectOverview/ProjectOverview';
import ProjectSampleDetail from './components/SampleDetail/ProjectSampleDetail';
import TreeDetail from './components/Trees/TreeDetail';
import LocalUpload from './components/Upload/LocalUpload';

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <Routes>
          {/* <Route path="dashboard" element={<Navigate to="projects" />} /> */}
          <Route element={<MainMenuLayout />}>
            <Route path="/" element={<LocalUpload />} />
            <Route path="upload" element={<LocalUpload />} />
            <Route path="data/plots/map" element={<MapPage />} />
            <Route path="data/plots/:plotType" element={<PlotDetail />} />
            <Route path="data/trees/:treeId" element={<TreeDetail />} />
            <Route path="data/records/:seqId" element={<ProjectSampleDetail />} />
            <Route path="data/:tab" element={<ProjectOverview />} />
            <Route path="data" element={<ProjectOverview />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
