import { useMsal } from "@azure/msal-react";
import { Button } from "@mui/material";

export const LogoutButton = () => {
    const { instance } = useMsal();
    const logoutRequest = {
        account: instance.getActiveAccount(), // Bypasses the account selection screen on sign out
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/",
    }
    const handleLogout = (loginType: string) => {
        if (loginType === "popup") {
            instance.logoutPopup(logoutRequest)
        }
    }
    return (
        <Button variant="contained" color="secondary" onClick={() => handleLogout("popup")}>Logout</Button>
    );
}