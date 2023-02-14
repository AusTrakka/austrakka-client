import React, {createRef, useEffect, useState} from 'react';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";
import styles from "./MainMenu.module.css"

const Header = () => {
  return (
    <div className="pageHeader">
      <div className="breadcrumbs">
          Home / Upload
        </div>
        <Typography className="pageTitle">
            Upload
        </Typography>
    </div>
  )
}

const Upload = () => {
  useEffect(() => {

  }, [])

  return (
    <>
      <Header />
      {/* TODO: Add basic layout of Upload page here */}    
    </>
  )
}
export default Upload;