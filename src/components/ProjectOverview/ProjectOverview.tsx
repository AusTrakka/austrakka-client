import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, Link} from 'react-router-dom'
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import { Typography, Box, Tab, Tabs, Paper } from "@mui/material";
import { getSamples, getProjectDetails, getTotalSamples } from '../../utilities/resourceUtils';
import styles from './ProjectOverview.module.css'
import { ProjectSample } from '../../types/sample.interface';
import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import Plots from './Plots';
import CustomTabs from '../Common/CustomTabs';
import {TabContentProps} from '../Common/CustomTabs'

const ProjectOverview = () => {
  const [projectSamples, setProjectSamples] = useState<ProjectSample[]>([])
  const [projectDetails, setProjectDetails] = useState({description: ""})
  const [lastUpload, setlastUpload] = useState("")
  const [totalSamples, setTotalSamples] = useState(0)
  // Loading states for each tab
  const [isOverviewLoading, setIsOverviewLoading] = useState(true)
  const [isSamplesLoading, setIsSamplesLoading] = useState(true)
  const [isTreesLoading, setIsTreesLoading] = useState(true)
  const [isPlotsLoading, setIsPlotsLoading] = useState(true)

  useEffect(() => {
    getProject() //API calls
  }, [])

  async function getProject() {
    // TODO: Get project details (/api/Projects/id) based on project id rather than session storage 
    await getProjectDetails() 
      .then((response) => response.json())
      .then((response_data) => {
        setProjectDetails(response_data.data)
      })
      .catch(error => console.log(error))

    await getTotalSamples()
      .then((response) => {
        const count: string = response.headers.get('X-Total-Count')!
        setTotalSamples(parseInt(count))
        return response.json()
      })
      .catch(error => console.log(error))
    
    setIsOverviewLoading(false)
    // TODO: Define new endpoint that provides the latest upload date from backend
  }

  const projectOverviewTabs: TabContentProps[] = [
    {
      index: 0,
      title: "Summary",
      component: <Summary totalSamples={totalSamples} lastUpload={lastUpload} projectDesc={projectDetails.description} isOverviewLoading={isOverviewLoading} />
    },
    {
      index: 1,
      title: "Samples",
      component: <Samples totalSamples={totalSamples} sampleList={projectSamples} setProjectSamples={setProjectSamples} isSamplesLoading={isSamplesLoading}/>
    },
    {
      index: 2,
      title: "Trees",
      component: <TreeList isTreesLoading={isTreesLoading}/>
    },
    {
      index: 3,
      title: "Plots",
      component: <Plots isPlotsLoading={isPlotsLoading}/>
    }
  ]
  
  return (
    <>
      <CustomTabs tabContent={projectOverviewTabs}/>
    </>
  )
}
export default ProjectOverview;