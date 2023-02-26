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

//TODO: Define types for expected responses from the key endpoints and pass them to the initial states

//

const ProjectOverview = () => {
  // TODO: Clear state on component unmount - for cleanliness when a user goes back and changes the project which they selected 
  const [state, updateState] = useState({
    loading: false,
    projectDetails: {},
    totalSamples: 0,
    projectDesc: "",
    lastUpload: ""
  })
  const [projectSubmissions, setProjectSubmissions] = useState([])
  const [projectAnalyses, setProjectAnalyses] = useState()
  const [projectDetails, setProjectDetails] = useState({description: ""})

  useEffect(() => {
    getProject() //API calls
  }, [])

  useEffect(() => {
    populateTabComponents() //pushing stateful props based on API response
  }, [projectDetails, projectAnalyses, projectSubmissions, state]) 

  async function getProject() {
    // TODO: Get project details (/api/Projects/id) based on project id rather than session storage 
    await getProjectDetails() 
      .then((response) => response.json())
      .then((response_data) => {
        setProjectDetails(response_data.data)
      })
      .catch(error => console.log(error))

    // Get submissions 
    await getSubmissions()
      .then((response) => response.json())
      .then((response_data) => {
        setProjectSubmissions(response_data)
        // Get latest upload date
        let latestDate = new Date(
          Math.max(
            ...response_data.map((element:any) => {
              let formattedDate = ((new Date (element.created)))
              return formattedDate
            })
          )
        )
        updateState({...state, lastUpload: latestDate.toDateString()})
      })
      .catch(error => console.log(error))
    
    // Get analyses  
    await getAnalyses()
      .then((response) => response.json())
      .then((response_data) => {
        setProjectAnalyses(response_data)
      })
      .catch(error => console.log(error))
  }

  function populateTabComponents() {
    projectOverviewTabs.forEach((tab) => {
      if (tab.title == "Summary") {tab.component = <Summary samples={projectSubmissions.length} lastUpload={state.lastUpload} projectDesc={projectDetails.description} />}
      if (tab.title == "Samples") {tab.component = <Samples />}
      if (tab.title == "Trees") {tab.component = <TreeList />}
      if (tab.title == "Plots") {tab.component = <Plots />}
    })
  }
  
  return (
    <>
      <CustomTabs tabContent={projectOverviewTabs}/>
    </>
  )
}
export default ProjectOverview;