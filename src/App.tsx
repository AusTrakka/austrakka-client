import './App.css'
import {Routes, Route, NavLink, Router} from 'react-router-dom'
import 'react-tabulator/lib/styles.css'
import Projects from './components/pages/Projects'
import Upload from './components/pages/Upload'
import SideMenu from './components/SideMenu'
import {useState} from "react";

function App() {
  
  return (
    <>
      <SideMenu />
      <Routes>
        {/* <Route path="/" />
        <Route path="/login" /> */}
        <Route path="/upload" element={<Upload/>} />
        <Route path="/projects" element={<Projects/>}/>
      </Routes>
    </>
  )
}

export default App
