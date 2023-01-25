import React, {createRef, useEffect, useState} from 'react';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";
import MainMenu from '../MainMenu/MainMenu';

const Header = () => {
  return (
    <>
      <div className="pageHeader">
        <div className="breadcrumbs">
            Home / Projects
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
  const [pageStyling, updatePageStyling] = useState("pagePadded")
  //const tableRef = createRef<Tabulator>();
  const columns = [
    { title: "Abbreviation", field: "abbreviation"},
    { title: "Name", field: "name" },
    { title: "Description", field: "description" },
    /* { title: "Project Analyses", field: "" }, */
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

  const handlePadding = (drawer: boolean | undefined) => {
    if (drawer === true) {
      updatePageStyling("pagePadded")
    } else {
      updatePageStyling("page")
    }
  };
  
  return (
    <>
      <MainMenu handlePadding={handlePadding} />
      <div className={pageStyling}>
        <Header />
        <ReactTabulator
          //ref={tableRef}
          data={projectsList}
          columns={columns}
          layout={"fitData"}
        />
      </div>
    </>
  )
}
export default Projects;