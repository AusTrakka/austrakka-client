import React from 'react';
import { useMsal } from '@azure/msal-react';
import { MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import { Logout } from '@mui/icons-material/';

export default function LogoutButton(props: any) {
  const { instance } = useMsal();
  const { showText } = props;
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
      <ListItemIcon sx={{ color: 'primary.main', minWidth: 0, mr: showText ? 1 : 'auto', justifyContent: 'center' }}><Logout /></ListItemIcon>
      {
        showText ?
          <ListItemText sx={{ color: 'primary.main' }}>Logout</ListItemText>
          : null
      }
    </MenuItem>
  );
}
