import React from 'react';
import { useMsal } from '@azure/msal-react';
import { MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import { Logout } from '@mui/icons-material/';

export default function LogoutButton() {
  const { instance } = useMsal();
  const logoutRequest = {
    account: instance.getActiveAccount(),
    postLogoutRedirectUri: '/',
    mainWindowRedirectUri: '/',
  };
  const handleLogout = (loginType: string) => {
    if (loginType === 'redirect') {
      instance.logoutRedirect(logoutRequest);
    }
  };
  return (
    <MenuItem onClick={() => handleLogout('redirect')}>
      <ListItemIcon><Logout /></ListItemIcon>
      <ListItemText>Logout</ListItemText>
    </MenuItem>
  );
}
