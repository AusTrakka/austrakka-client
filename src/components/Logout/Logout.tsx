import React, {createRef, useEffect, useState} from 'react';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import {Typography, Button} from "@mui/material";
import {NavLink} from 'react-router-dom'

const Logout = () => {
  
  useEffect(() => {

  }, [])
  
  return (
    <div>
        <Typography variant="h3">
        You have been successfully logged out.
        </Typography>
    </div>
  )
}
export default Logout;