import React, {createRef, useEffect} from 'react';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";

const Projects = () => {
  const tableRef = createRef<Tabulator>();
  const columns = [
    { title: "Name", field: "name", width: 150 },
    { title: "Age", field: "age"},
    { title: "Favourite Color", field: "col" },
    { title: "Date Of Birth", field: "dob",  },
    { title: "Rating", field: "rating"},
    { title: "Passed?", field: "passed" }
  ];
  var data = [
    {id:1, name:"Oli Bob", age:"12", col:"red", dob:""},
    {id:2, name:"Mary May", age:"1", col:"blue", dob:"14/05/1982"},
    {id:3, name:"Christine Lobowski", age:"42", col:"green", dob:"22/05/1982"},
    {id:4, name:"Brendon Philips", age:"125", col:"orange", dob:"01/08/1980"},
    {id:5, name:"Margret Marmajuke", age:"16", col:"yellow", dob:"31/01/1999"},
  ];
  // Test API fetch; requires authentication disabled and CORS from client
  fetch('https://localhost:5001/api/Projects?includeall=false')
      .then((response) => response.json())
      .then((response_data) => {
        console.log(response_data);
      });
  
  // Maybe not needed
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.redraw();
    }
  })
  
  return (
    <div>
      <Typography variant="h3">
        Projects
      </Typography>
      
      <ReactTabulator
        ref={tableRef}
        data={data}
        columns={columns}
        layout={"fitData"}
      />
    </div>
  )
}
export default Projects;