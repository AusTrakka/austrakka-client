import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { StyledEngineProvider } from '@mui/material/styles';
// import { MsalProvider } from '@azure/msal-react';
import { Provider } from 'react-redux';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import { msalInstance } from './utilities/authUtils';
import store from './app/store';
import ApiProvider from './app/ApiContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      {/* StyledEngineProvider: Allows MUI's styles to be overridden */}
      <StyledEngineProvider injectFirst>
        <MsalProvider instance={msalInstance}>
          <ApiProvider>
            <App />
          </ApiProvider>
        </MsalProvider>
      </StyledEngineProvider>
    </BrowserRouter>
  </Provider>,
  // </React.StrictMode>
);
