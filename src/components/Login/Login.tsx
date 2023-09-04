import React, { useEffect, useState } from 'react';
import { Button, Alert, Typography, Box, Grid } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import AusTrakkaLogo from '../../assets/logos/AusTrakka_Logo_cmyk.png';
import { loginRequest } from '../../config/authConfig';

// TODO: Add login loading and login failure features
function LoginButton() {
  const { instance, inProgress } = useMsal();
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (loginType: string) => {
    if (loginType === 'redirect') {
      instance.loginRedirect(loginRequest).catch(() => {
        setLoginError(true);
      });
    }
  };
  return (
    <>
      <Button
        variant="contained"
        onClick={() => handleLogin('redirect')}
        disabled={inProgress === InteractionStatus.Login}
      >
        Log in
      </Button>
      { loginError
        ? (
          <Alert severity="error" sx={{ m: 2, textAlign: 'left' }}>
            There has been an error logging you in to AusTrakka, please try again later.
          </Alert>
        ) : null }
    </>
  );
}

function Login() {
  useEffect(() => {

  }, []);

  return (
    <Box sx={{ height: '100vh', backgroundColor: 'rgb(238, 242, 246)' }}>
      <Box sx={{ backgroundColor: 'white', width: '400px', padding: 3, borderRadius: 1, boxShadow: 1 }}>
        <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
          <Grid item>
            <img src={AusTrakkaLogo} alt="at-logo" width="240px" />
          </Grid>
          <Grid item>
            <Typography variant="h2" color="primary">
              Welcome to AusTrakka
            </Typography>
          </Grid>
          <Grid item>
            From genomics to public health decisions for Australia
          </Grid>
          <Grid item>
            Combining Genomics & Epidemiological Data
          </Grid>
          <Grid item>
            <LoginButton />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
export default Login;
