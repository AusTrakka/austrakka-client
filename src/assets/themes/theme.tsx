import { createTheme, ThemeProvider } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

export const theme: ThemeOptions = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0a3546',
    },
    secondary: {
      main: '#90ca6d',
    },
    background: {
      paper: '#f9f9f9',
    },
  },
  typography: {
    h1: {
      fontSize: '3.6rem',
    },
  },
});
