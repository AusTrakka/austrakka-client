import { createTheme } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

const theme: ThemeOptions = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: import.meta.env.VITE_THEME_PRIMARY_BLUE_HEX,
    },
    secondary: {
      main: import.meta.env.VITE_THEME_PRIMARY_GREEN_HEX,
    },
    background: {
      // @ts-ignore
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
