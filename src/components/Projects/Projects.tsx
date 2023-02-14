import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, useNavigate, Link } from 'react-router-dom'
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator, reactFormatter } from 'react-tabulator'
import { IconButton } from "@mui/material"
import SearchIcon from '@mui/icons-material/Search';
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";
import {isoDateLocalDate, callAPI} from "../../utilities/AppUtils"

const Header = () => {
  return (
    <>
      <div className="pageHeader">
        <div className="breadcrumbs">
            Home / <Link id="link" to='/projects'>Projects</Link>
          </div>
          <Typography className="pageTitle">
              Projects
          </Typography>
      </div>
    </>
  )
}

const Projects = () => {
  const [projectsList, setProjectsList] = useState([])
  const [loading, setLoading] = useState()
  const [selectedProject, setSelectedProject] = useState({})
  const [includeAll, setIncludeAll] = useState(false)
  const navigate = useNavigate()

  const columns = [
    { title: "Abbreviation", field: "abbreviation"},
    { title: "Name", field: "name" },
    { title: "Description", field: "description"},
    { title: "Project Analyses", field: "projectAnalyses", formatter: function(analyses:any){
      let analysesDetails = analyses.getValue()
      let list: string[] = []
      analysesDetails.forEach((element: { name: string; }) => {
        list.push(element.name)
      });
      return list.toString().replace(",", "<br />")
    }},
    { title: "Created", field: "created", formatter: function(datetime:any){ return isoDateLocalDate(datetime) }},
    { title: "Last Updated", field: "lastUpdated", formatter: function(datetime:any){ return isoDateLocalDate(datetime) }},
    { title: "Created By", field: "createdBy"},
    { title: "Last Updated By", field: "lastUpdatedBy"}
  ];
  
  useEffect(() => {
    getProjects()
  }, [])

  useEffect(() => {
    if (Object.keys(selectedProject).length !== 0) {
      const { projectMembers, name, projectId }: any = selectedProject
      sessionStorage.setItem('selectedProjectMemeberGroupId', projectMembers.id)
      sessionStorage.setItem('selectedProjectName', name)
      sessionStorage.setItem('selectedProjectId', projectId)
      navigate("/projects/details")
    }
  }, [selectedProject])

  async function getProjects() {
    await callAPI(`/api/Projects?&includeall=${includeAll}`, 'GET', {})
      .then((response: any) => response.json())
      .then((response_data) => {
        console.log(response_data)
        setProjectsList(response_data);
      })
      .catch(error => console.log(error))
  }

  const rowClickHandler = (e: any, row: any) => {
    let selectedProject = row.getData()
    setSelectedProject(selectedProject)
  };
  
  return (
    <>
      <Header />
      <ReactTabulator
        data={projectsList}
        columns={columns}
        layout={"fitData"}
        events={{
          rowClick: rowClickHandler,
        }}
      />
    </>
  )
}
export default Projects;