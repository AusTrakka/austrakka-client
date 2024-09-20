import { createTheme } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

// TODO: Store these three in terraform config, and pull these from vite
const theme: ThemeOptions = createTheme({
  palette: {
    mode: 'light',
    primary: {
      //main: '#0a3546',
      main: import.meta.env.VITE_THEME_PRIMARY_HEX,
    },
    secondary: {
      //main: '#90ca6d',
      main: import.meta.env.VITE_THEME_SECONDARY_HEX,
    },
    background: {
      //paper: '#ffffff',
      main: import.meta.env.VITE_THEME_BACKGROUND_HEX,
    },
  },
  typography: {
    h1: {
      fontSize: '3.6rem',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 'bold',
    },
    h3: {
      fontSize: '1.5rem',
    },
    h4: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
    },
  },
});
export default theme;
