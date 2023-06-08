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
    background: {
      paper: '#ffffff',
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
  },
});
export default theme;
