import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { StyledEngineProvider } from '@mui/material/styles';
// import { MsalProvider } from '@azure/msal-react';
import App from './App';
import { msalInstance } from './utilities/authUtils';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <BrowserRouter>
    {/* StyledEngineProvider: Allows MUI's styles to be overridden */}
    <StyledEngineProvider injectFirst>
      <App msalInstance={msalInstance} />
    </StyledEngineProvider>
  </BrowserRouter>,
  // </React.StrictMode>
);
