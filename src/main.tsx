import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { MsalProvider } from '@azure/msal-react';
import { GlobalStyles } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { Provider } from 'react-redux';
import App from './App';
import ApiProvider from './app/ApiContext';
import store from './app/store';
import { globalStyles } from './assets/themes/theme';
import { msalInstance } from './utilities/authUtils';

if (import.meta.env.DEV) {
  await import('./wdyr');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      {/* StyledEngineProvider: Allows MUI's styles to be overridden */}
      <StyledEngineProvider injectFirst>
        <MsalProvider instance={msalInstance}>
          <ApiProvider>
            <GlobalStyles styles={globalStyles} />
            <SnackbarProvider
              autoHideDuration={5000}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              maxSnack={10}
            >
              <App />
            </SnackbarProvider>
          </ApiProvider>
        </MsalProvider>
      </StyledEngineProvider>
    </BrowserRouter>
  </Provider>,
  // </React.StrictMode>
);
