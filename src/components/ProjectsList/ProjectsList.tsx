import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route, useNavigate, Link } from 'react-router-dom'
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator, reactFormatter } from 'react-tabulator'
import { IconButton } from "@mui/material"
import SearchIcon from '@mui/icons-material/Search';
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../config/authConfig";
import { getProjectList } from '../../utilities/resourceUtils';


const ProjectsList = () => {
  const [projectsList, setProjectsList] = useState([])
  const [loading, setLoading] = useState()
  const [selectedProject, setSelectedProject] = useState({})
  const [includeAll, setIncludeAll] = useState(false)
  const navigate = useNavigate()

  const columns = [
    { title: "Abbreviation", field: "abbreviation"},
    { title: "Name", field: "name" },
    { title: "Description", field: "description"},
    { title: "Created", field: "created", formatter: function(datetime:any){ return isoDateLocalDate(datetime) }}
  ];
  
  useEffect(() => {
    getProjectList()
    .then((response) => response.json())
    .then((response_data) => {
      setProjectsList(response_data);
    })
    .catch(error => {
      console.error('There was an error retrieving project data!', error);
    });
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

  const rowClickHandler = (e: any, row: any) => {
    let selectedProject = row.getData()
    setSelectedProject(selectedProject)
  };
  
  return (
    <>
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
export default ProjectsList;