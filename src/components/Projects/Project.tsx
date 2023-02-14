import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, Link} from 'react-router-dom'
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";
import {callAPI} from "../../utilities/AppUtils"


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

const Project = () => {
  const [pageStyling, updatePageStyling] = useState("pagePadded")
  const [loading, setLoading] = useState()
  const [projectSubmissions, setProjectSubmissions] = useState()
  const [selectedProjectName] = useState(sessionStorage.getItem("selectedProjectName"))
  const [selectedProjectMemeberGroupId] = useState(sessionStorage.getItem("selectedProjectMemeberGroupId"))
  const [selectedProjectId] = useState(sessionStorage.getItem("selectedProjectId"))


  //Get project name and details from localStorage item (selected project Id)
  useEffect(() => {
    getProjectDetails()
  }, [])

  async function getProjectDetails() {
    // Get submissions from Project Id
    await callAPI(`/api/Submissions?groupContext=${selectedProjectMemeberGroupId}`, 'GET', {})
      .then((response: any) => response.json())
      .then((response_data) => {
        console.log("Submissions: ")
        console.log(response_data)
        setProjectSubmissions(response_data);
      })
      .catch(error => console.log(error))
    
    // Get analyses from Project Id  - https://localhost:5001/api/Analyses/?filters=ProjectId==1&includeall=False
    await callAPI(`/api/Analyses/?filters=ProjectId==${selectedProjectId}&includeall=False`, 'GET', {})
    .then((response: any) => response.json())
    .then((response_data) => {
      console.log("Analyses: ")
      console.log(response_data)
      setProjectSubmissions(response_data);
    })
    .catch(error => console.log(error))
  }
  
  const handlePadding = (drawer: boolean | undefined) => {
    if (drawer === true) {
      updatePageStyling("pagePadded")
    } else {
      updatePageStyling("page")
    }
  };
  
  return (
    <>
      <div className={pageStyling}>
          <Header project={selectedProjectName} />
      </div>

    </>
  )
}
export default Project;