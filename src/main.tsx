import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { StyledEngineProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { MsalProvider } from '@azure/msal-react';
import { GlobalStyles } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import App from './App';
import { msalInstance } from './utilities/authUtils';
import store from './app/store';
import { globalStyles } from './assets/themes/theme';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      {/* StyledEngineProvider: Allows MUI's styles to be overridden */}
      <StyledEngineProvider injectFirst>
        <MsalProvider instance={msalInstance}>
          <GlobalStyles styles={globalStyles} />
          <SnackbarProvider
            autoHideDuration={5000}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            maxSnack={10}
          >
            <App />
          </SnackbarProvider>
        </MsalProvider>
      </StyledEngineProvider>
    </BrowserRouter>
  </Provider>,
  // </React.StrictMode>
);
