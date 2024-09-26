import { createTheme } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

const theme: ThemeOptions = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: import.meta.env.VITE_THEME_PRIMARY_BLUE,
    },
    secondary: {
      main: import.meta.env.VITE_THEME_PRIMARY_GREEN,
    },
    background: {
      // @ts-ignore
      main: import.meta.env.VITE_THEME_BACKGROUND,
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

export const globalStyles = {
  ':root': {
    // material-ui
    '--primary-blue': import.meta.env.VITE_THEME_PRIMARY_BLUE,
    '--primary-green': import.meta.env.VITE_THEME_PRIMARY_GREEN,
    '--primary-grey': import.meta.env.VITE_THEME_PRIMARY_GREY,
    '--secondary-dark-grey': import.meta.env.VITE_THEME_SECONDARY_DARK_GREY,
    '--secondary-light-grey': import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREY,
    '--secondary-teal': import.meta.env.VITE_THEME_SECONDARY_TEAL,
    '--secondary-light-green': import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREEN,
    '--secondary-dark-green': import.meta.env.VITE_THEME_SECONDARY_DARK_GREEN,
    '--secondary-blue': import.meta.env.VITE_THEME_SECONDARY_BLUE,
    '--secondary-purple': import.meta.env.VITE_THEME_SECONDARY_PURPLE,
    '--secondary-orange': import.meta.env.VITE_THEME_SECONDARY_ORANGE,
    '--secondary-red': import.meta.env.VITE_THEME_SECONDARY_RED,
    '--secondary-yellow': import.meta.env.VITE_THEME_SECONDARY_YELLOW,
    'color-scheme': 'light',
    // primereact
    '--primary-50': import.meta.env.VITE_THEME_PRIMARY_GREEN_50,
    '--primary-100': import.meta.env.VITE_THEME_PRIMARY_GREEN_100,
    '--primary-200': import.meta.env.VITE_THEME_PRIMARY_GREEN_200,
    '--primary-300': import.meta.env.VITE_THEME_PRIMARY_GREEN_300,
    '--primary-400': import.meta.env.VITE_THEME_PRIMARY_GREEN_400,
    '--primary-500': import.meta.env.VITE_THEME_PRIMARY_GREEN_500,
    '--primary-600': import.meta.env.VITE_THEME_PRIMARY_GREEN_600,
    '--primary-700': import.meta.env.VITE_THEME_PRIMARY_GREEN_700,
    '--primary-800': import.meta.env.VITE_THEME_PRIMARY_GREEN_800,
    '--primary-900': import.meta.env.VITE_THEME_PRIMARY_GREEN_900,
    // austrakka
    '--background-colour': import.meta.env.VITE_THEME_BACKGROUND,
    '--primary-grey-50': import.meta.env.VITE_THEME_PRIMARY_GREY_50,
    '--primary-grey-100': import.meta.env.VITE_THEME_PRIMARY_GREY_100,
    '--primary-grey-200': import.meta.env.VITE_THEME_PRIMARY_GREY_200,
    '--primary-grey-300': import.meta.env.VITE_THEME_PRIMARY_GREY_300,
    '--primary-grey-400': import.meta.env.VITE_THEME_PRIMARY_GREY_400,
    '--primary-grey-500': import.meta.env.VITE_THEME_PRIMARY_GREY_500,
    '--primary-grey-600': import.meta.env.VITE_THEME_PRIMARY_GREY_600,
    '--primary-grey-700': import.meta.env.VITE_THEME_PRIMARY_GREY_700,
    '--primary-grey-800': import.meta.env.VITE_THEME_PRIMARY_GREY_800,
    '--primary-grey-900': import.meta.env.VITE_THEME_PRIMARY_GREY_900,
    '--primary-blue-bg': import.meta.env.VITE_THEME_PRIMARY_BLUE_BG,
  },
};
