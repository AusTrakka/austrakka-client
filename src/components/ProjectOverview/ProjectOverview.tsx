import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, Link} from 'react-router-dom'
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import { Typography, Box, Tab, Tabs, Paper } from "@mui/material";
import { getSamples, getProjectDetails } from '../../utilities/resourceUtils';
import styles from './ProjectOverview.module.css'
import { ProjectSample } from '../../types/sample.interface';
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
  const [projectSamples, setProjectSamples] = useState<ProjectSample[]>([])
  const [projectDetails, setProjectDetails] = useState({description: ""})
  const [lastUpload, setlastUpload] = useState("")
  const [totalSamples, setTotalSamples] = useState("")
  const [isOverviewLoading, setIsOverviewLoading] = useState(true)

  useEffect(() => {
    getProject() //API calls
  }, [])

  useEffect(() => {
    populateTabComponents() //pushing stateful props based on API response
  }, [projectDetails, projectSamples, totalSamples, lastUpload]) 

  async function getProject() {
    // TODO: Get project details (/api/Projects/id) based on project id rather than session storage 
    await getProjectDetails() 
      .then((response) => response.json())
      .then((response_data) => {
        setProjectDetails(response_data.data)
      })
      .catch(error => console.log(error))

    await getSamples(`?groupContext=${sessionStorage.getItem("selectedProjectMemberGroupId")}`)
      .then((response) => {
        const count: string = response.headers.get('X-Total-Count')!
        setTotalSamples(count)
        return response.json()
      })
      .then((response_data) => {
        setProjectSamples(response_data)
      })
      .catch(error => console.log(error))
      // TODO: Define new endpoint that provides the latest upload date from backend
  }

  function populateTabComponents() {
    projectOverviewTabs.forEach((tab) => {
      if (tab.title == "Summary") {tab.component = <Summary totalSamples={totalSamples} lastUpload={lastUpload} projectDesc={projectDetails.description} isOverviewLoading={isOverviewLoading} />}
      if (tab.title == "Samples") {tab.component = <Samples totalSamples={totalSamples} sampleList={projectSamples} setProjectSamples={setProjectSamples}/>}
      if (tab.title == "Trees") {tab.component = <TreeList />}
      if (tab.title == "Plots") {tab.component = <Plots />}
    })
    setIsOverviewLoading(false)
  }
  
  return (
    <>
      <CustomTabs tabContent={projectOverviewTabs}/>
    </>
  )
}
export default ProjectOverview;