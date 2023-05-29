import { createTheme } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

const theme: ThemeOptions = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0a3546',
    },
    secondary: {
      main: '#90ca6d',
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
  },
});
export default theme;
