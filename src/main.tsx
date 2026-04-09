import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { Button, GlobalStyles, StyledEngineProvider } from '@mui/material';
import { closeSnackbar, SnackbarProvider } from 'notistack';
import { Provider } from 'react-redux';
import App from './App';
import store from './app/store';
import { globalStyles } from './assets/themes/theme';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      {/* StyledEngineProvider: Allows MUI's styles to be overridden */}
      <StyledEngineProvider injectFirst>
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
      </StyledEngineProvider>
    </BrowserRouter>
  </Provider>,
  // </React.StrictMode>
);
