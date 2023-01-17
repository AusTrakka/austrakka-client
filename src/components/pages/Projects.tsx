import React, {createRef, useEffect, useState} from 'react';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";

const Projects = () => {
  const [projectsList, setProjectsList] = useState([])
  //const tableRef = createRef<Tabulator>();
  const columns = [
    { title: "Abbreviation", field: "abbreviation"},
    { title: "Name", field: "name" },
    { title: "Description", field: "description" },
  ];
  
  useEffect(() => {
    // Test API fetch; requires authentication disabled and CORS allowed from client
    fetch('https://localhost:5001/api/Projects?includeall=false')
        .then((response) => response.json())
        .then((response_data) => {
          console.log(response_data);
          setProjectsList(response_data);
        });
  }, [])
  
  return (
    <div>
      <Typography variant="h3">
        Projects
      </Typography>
      
      <ReactTabulator
        //ref={tableRef}
        data={projectsList}
        columns={columns}
        layout={"fitData"}
      />
    </div>
  )
}
export default Projects;