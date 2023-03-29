import React from 'react';
import { useMsal } from '@azure/msal-react';
import { Button } from '@mui/material';

export default function LogoutButton() {
  const { instance } = useMsal();
  const logoutRequest = {
    account: instance.getActiveAccount(), // Bypasses the account selection screen on sign out
    postLogoutRedirectUri: '/',
    mainWindowRedirectUri: '/',
  };
  const handleLogout = (loginType: string) => {
    if (loginType === 'redirect') {
      instance.logoutRedirect(logoutRequest);
    }
  };
  return (
    <Button variant="contained" color="secondary" onClick={() => handleLogout('redirect')}>Logout</Button>
  );
}
