import { useMsal } from '@azure/msal-react';
import { Logout } from '@mui/icons-material';
import { ListItemIcon, ListItemText, MenuItem, Tooltip } from '@mui/material';

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
    <Tooltip title={showText ? '' : 'Logout'} arrow placement="right">
      <MenuItem onClick={() => handleLogout('redirect')}>
        <ListItemIcon
          sx={{
            color: 'primary.main',
            minWidth: 0,
            mr: showText ? 1 : 'auto',
            justifyContent: 'center',
          }}
        >
          <Logout />
        </ListItemIcon>
        {showText ? <ListItemText sx={{ color: 'primary.main' }}>Logout</ListItemText> : null}
      </MenuItem>
    </Tooltip>
  );
}
