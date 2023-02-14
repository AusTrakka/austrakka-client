import React, {createRef, useEffect, useState} from 'react';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import 'react-tabulator/lib/styles.css';
import {Typography, Button} from "@mui/material";
import {NavLink} from 'react-router-dom'
import styles from "./Login.module.css"
import AusTrakkaLogo from "../../assets/logos/AusTrakka_Logo_cmyk.png"

const Login = () => {
  
  useEffect(() => {

  }, [])
  
  return (
    <div className={styles.main}>
        <img src={AusTrakkaLogo} className={styles.logo} />
        <br />
        <div className={styles.h1}>Welcome to AusTrakka</div>
        <div className={styles.h2}>From genomics to public health decisions for Australia</div>
        <br />
        <div className={styles.h3}>Combining Genomics & Epidemiological Data</div>

        <Button variant="contained" href="/projects" className={styles.button}>
            Log in
        </Button>
    </div>
  )
}
export default Login;