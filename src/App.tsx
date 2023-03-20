import './App.css'
import {Routes, Route, Navigate} from 'react-router-dom'
import MainMenuLayout from './components/Layouts/MainMenuLayout'
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import ProjectsList from './components/ProjectsList/ProjectsList'
import ProjectOverview from './components/ProjectOverview/ProjectOverview'
import Upload from './components/Upload/Upload'
import Login from './components/Login/Login'
import { theme } from './assets/themes/theme'
import { ThemeProvider } from '@mui/material';

function App() {

  return (
    <>
      <ThemeProvider theme={theme}>
        <AuthenticatedTemplate>
          <Routes>
            <Route path="/" element={<Navigate to="/projects" />}/>
            <Route path="/dashboard" element={<Navigate to="/projects" />}/>
            <Route element={<MainMenuLayout/>}>
              <Route path="/upload" element={<Upload/>} />
              <Route path="/projects" element={<ProjectsList/>}/>
              <Route path="/projects/details" element={<ProjectOverview/>}/>
            </Route>
            <Route path='*' element={<Navigate to="/projects" />} />
          </Routes>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <Routes>
              <Route path='*' element={<Login/>} />
          </Routes>
        </UnauthenticatedTemplate>
      </ThemeProvider>
    </>
  )
}

export default App
