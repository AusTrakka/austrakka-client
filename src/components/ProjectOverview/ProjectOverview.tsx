import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, Link} from 'react-router-dom'
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import { Typography, Box, Tab, Tabs, Paper } from "@mui/material";
import { getAnalyses, getSubmissions, getProjectDetails } from '../../utilities/resourceUtils';
import styles from './ProjectOverview.module.css'
import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import Plots from './Plots';
import CustomTabs from '../Common/CustomTabs';

// Define number of tabs and their titles
interface TabContentProps {
  index: number, 
  title: string, 
  component: JSX.Element
}
const projectOverviewTabs: TabContentProps[] = [
  {
    index: 0,
    title: "Summary",
    component: <></>
  },
  {
    index: 1,
    title: "Samples",
    component: <></>
  },
  {
    index: 2,
    title: "Trees",
    component: <></>
  },
  {
    index: 3,
    title: "Plots",
    component: <></>
  }
]

const ProjectOverview = () => {
  const [state, updateState] = useState({
    loading: false,
    projectDetails: {},
    totalSamples: 0,
    projectDesc: "",
    lastUpload: ""
  })
  const [projectSubmissions, setProjectSubmissions] = useState()
  const [projectAnalyses, setProjectAnalyses] = useState()
  const [projectDetails, setProjectDetails] = useState()

  //Get project name and details from localStorage item (selected project Id)
  useEffect(() => {
    getProject()
  }, [])

  async function getProject() {
    // TODO: Get project details (/api/Projects/id) based on project id rather than session storage 
    await getProjectDetails() 
    .then((response) => response.json())
    .then((response_data) => { 
      setProjectDetails(response_data)
    })
    .catch(error => console.log(error))

    // Get submissions 
    await getSubmissions()
      .then((response) => response.json())
      .then((response_data) => { 
        setProjectSubmissions(response_data) 
      })
      .catch(error => console.log(error))
    
    // Get analyses  
    await getAnalyses()
    .then((response) => response.json())
    .then((response_data) => { setProjectAnalyses(response_data) })
    .catch(error => console.log(error)) 

    //updateState({...state, projectDesc: projectDetails.data.description, totalSamples: 9})
  }
  
  return (
    <>
      <CustomTabs tabContent={projectOverviewTabs}/>
    </>
  )
}
export default ProjectOverview;