
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { StyledEngineProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { MsalProvider } from '@azure/msal-react';
import { Button, GlobalStyles } from '@mui/material';
import { SnackbarProvider, closeSnackbar } from 'notistack';
import App from './App';
import { msalInstance } from './utilities/authUtils';
import store from './app/store';
import ApiProvider from './app/ApiContext';
import { globalStyles } from './assets/themes/theme';

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
              hideIconVariant
              action={(key) => (
                <Button
                  onClick={() => closeSnackbar(key)}
                  // an invisible button overlaying the whole snackbar
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    color: 'transparent',
                  }}
                >
                  Dismiss
                </Button>
              )}
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
