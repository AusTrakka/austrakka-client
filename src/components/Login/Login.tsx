import { useEffect } from 'react';
import { Button } from "@mui/material";
import styles from "./Login.module.css"
import AusTrakkaLogo from "../../assets/logos/AusTrakka_Logo_cmyk.png"
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../config/authConfig";


//TODO: Add login loading and login failure features
const Login = () => {
  
  useEffect(() => {

  }, [])

  const LoginButton = () => {
    const { instance } = useMsal();

    const handleLogin = (loginType: string) => {
        if (loginType === "popup") {
            instance.loginPopup(loginRequest).catch(error => {
                console.log(error);
            });
        }
    }
    return (
        <Button variant="contained" onClick={() => handleLogin("popup")}>Log in</Button>
    );
  }
  
  return (
    <div className={styles.main}>
        <img src={AusTrakkaLogo} className={styles.logo} />
        <br />
        <div className={styles.h1}>Welcome to AusTrakka</div>
        <div className={styles.h2}>From genomics to public health decisions for Australia</div>
        <br />
        <div className={styles.h3}>Combining Genomics & Epidemiological Data</div>
        <LoginButton />
    </div>
  )
}
export default Login;