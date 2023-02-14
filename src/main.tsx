import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App'
import './index.css'
import { StyledEngineProvider } from "@mui/material/styles"
import "bootstrap/dist/css/bootstrap.min.css";
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./config/authConfig";

export const msalInstance = new PublicClientApplication(msalConfig); 
const navigate = useNavigate()

// Adding MSAL events
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.payload) {
    const payload = event.payload as AuthenticationResult;
    const account = payload.account;
    if (event.eventType === EventType.LOGIN_SUCCESS) {
      msalInstance.setActiveAccount(account)
    } else if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
      navigate("/login")
      sessionStorage.clear()
    }
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  //<React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        {/* StyledEngineProvider: Allows MUI's styles to be overridden */}
        <StyledEngineProvider injectFirst>
          <App />
        </StyledEngineProvider>
      </BrowserRouter>
    </MsalProvider>
  //</React.StrictMode>
)
