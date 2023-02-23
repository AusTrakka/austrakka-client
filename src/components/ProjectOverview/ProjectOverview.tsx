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


const Header = ( project :any ) => {
  return (
    <>
      <div className="pageHeader">
        <div className="breadcrumbs">
          Home / <Link id="link" to='/projects'>Projects</Link> / {project.project}
        </div>
        <Typography className="pageTitle">
          {project.project}
        </Typography>
      </div>
    </>
  )
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const ProjectOverview = () => {
  const [state, updateState] = useState({
    loading: false,
    tabValue: 0,
    totalSamples: 0,
    projectDesc: "",
    lastUpload: ""
  })
  //
  const [projectSubmissions, setProjectSubmissions] = useState()
  const [projectAnalyses, setProjectAnalyses] = useState()
  const [selectedProjectName] = useState(sessionStorage.getItem("selectedProjectName"))
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    updateState({...state, tabValue: newValue});
  };
  
  return (
    <>
      <Header project={selectedProjectName} />
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className={styles.tabs} >
        <Tabs value={state.tabValue} onChange={handleTabChange} /* aria-label="basic tabs example" */ >
          <Tab label="Summary" {...a11yProps(0)} />
          <Tab label="Samples" {...a11yProps(1)} />
          <Tab label="Trees" {...a11yProps(2)} />
          <Tab label="Plots" {...a11yProps(3)} />
        </Tabs>
      </Box>
      <TabPanel value={state.tabValue} index={0}>
        <Summary projectDesc={state.projectDesc} samples={state.totalSamples} lastUpload={state.lastUpload} />
      </TabPanel>
      <TabPanel value={state.tabValue} index={1}>
       <Samples />
      </TabPanel>
      <TabPanel value={state.tabValue} index={2}>
        <TreeList />
      </TabPanel>
      <TabPanel value={state.tabValue} index={3}>
        <Plots />
      </TabPanel>
    </>
  )
}
export default ProjectOverview;