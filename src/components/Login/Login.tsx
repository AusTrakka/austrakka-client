import React, { useEffect, useState } from 'react';
import { Button, Alert, Typography, Box, Grid } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { LoginRounded } from '@mui/icons-material';
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
        endIcon={<LoginRounded />}
        sx={{ marginTop: 6 }}
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
    <Grid
      container
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: '100vh', backgroundImage: 'linear-gradient(var(--background-colour), var(--primary-grey-200))' }}
    >
      <Grid item>
        <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 0, borderBottom: 4, borderColor: 'secondary.main' }}>
          <Grid container spacing={3} direction="column" justifyContent="center" alignItems="stretch" textAlign="center">
            <Grid item>
              <img src={AusTrakkaLogo} alt="at-logo" width="280px" />
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
      </Grid>
    </Grid>
  );
}
export default Login;
