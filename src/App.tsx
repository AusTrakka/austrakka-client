import './App.css'
import {Routes, Route, NavLink, Router, RedirectFunction} from 'react-router-dom'
import 'react-tabulator/lib/styles.css'
import MainMenuLayout from './components/Layouts/MainMenuLayout'
import Projects from './components/Projects/Projects'
import Project from './components/Projects/Project'
import Upload from './components/Upload/Upload'
import Login from './components/Login/Login'
import Logout from './components/Logout/Logout'
import {useState} from "react";

function App() {
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/logout" element={<Logout/>}/>
        <Route element={<MainMenuLayout/>}>
          <Route path="/upload" element={<Upload/>} />
          <Route path="/projects" element={<Projects/>}/>
          <Route path="/projects/details" element={<Project/>}/>
        </Route>
      </Routes>
    </>
  )
}

export default App
