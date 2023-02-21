import React, {createRef, useEffect, useState} from 'react';
import {Routes, Route} from 'react-router-dom'
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import { ReactTabulator } from 'react-tabulator'
import {Tabulator} from "react-tabulator/lib/types/TabulatorTypes";
import {Typography} from "@mui/material";
import MainMenu from '../Common/MainMenu/MainMenu';
import { TravelExploreSharp } from '@mui/icons-material';

const Header = () => {
  return (
    <>
      <div className="pageHeader">
        <div className="breadcrumbs">
            Home / Projects / Project X / Tree
          </div>
          <Typography className="pageTitle">
              Project X
          </Typography>
      </div>
    </>
  )
}

const Tree = () => {
  
  return (
    <>
    <Header />
    </>
  )
}
export default Tree;