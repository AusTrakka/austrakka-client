import './App.css'
import {Routes, Route, NavLink, Router, RedirectFunction, Navigate} from 'react-router-dom'
import 'react-tabulator/lib/styles.css'
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import Projects from './components/Projects/Projects'
import Project from './components/Projects/Project'
import Upload from './components/Upload/Upload'
import Login from './components/Login/Login'

function App() {

  return (
    <>
      <AuthenticatedTemplate>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" />}/>
          <Route path="/dashboard" element={<Navigate to="/projects" />}/>
          <Route path="/upload" element={<Upload/>} />
          <Route path="/projects" element={<Projects/>}/>
          <Route path="/projects/details" element={<Project/>}/>
          <Route path='*' element={<Navigate to="/projects" />} />
        </Routes>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Routes>
            <Route path='*' element={<Login/>} />
        </Routes>
      </UnauthenticatedTemplate>
    </>
  )
}

export default App
