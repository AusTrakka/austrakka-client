import { createTheme } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

const theme: ThemeOptions = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: import.meta.env.VITE_THEME_PRIMARY_MAIN,
    },
    secondary: {
      main: import.meta.env.VITE_THEME_SECONDARY_MAIN,
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

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // return {r, g, b} 
  return `${r}, ${g}, ${b}`;
}

export const globalStyles = {
  ':root': {
    // material-ui
    '--primary-main': import.meta.env.VITE_THEME_PRIMARY_MAIN,
    '--primary-main-rgb': hexToRgb(import.meta.env.VITE_THEME_PRIMARY_MAIN),
    '--secondary-main-rgb': hexToRgb(import.meta.env.VITE_THEME_SECONDARY_MAIN),
    '--secondary-main': import.meta.env.VITE_THEME_SECONDARY_MAIN,
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
    'colorScheme': 'light',
    // primereact
    '--primary-50': import.meta.env.VITE_THEME_SECONDARY_MAIN_50,
    '--primary-100': import.meta.env.VITE_THEME_SECONDARY_MAIN_100,
    '--primary-200': import.meta.env.VITE_THEME_SECONDARY_MAIN_200,
    '--primary-300': import.meta.env.VITE_THEME_SECONDARY_MAIN_300,
    '--primary-400': import.meta.env.VITE_THEME_SECONDARY_MAIN_400,
    '--primary-500': import.meta.env.VITE_THEME_SECONDARY_MAIN_500,
    '--primary-600': import.meta.env.VITE_THEME_SECONDARY_MAIN_600,
    '--primary-700': import.meta.env.VITE_THEME_SECONDARY_MAIN_700,
    '--primary-800': import.meta.env.VITE_THEME_SECONDARY_MAIN_800,
    '--primary-900': import.meta.env.VITE_THEME_SECONDARY_MAIN_900,
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
    '--primary-main-bg': import.meta.env.VITE_THEME_PRIMARY_MAIN_BG,
    // shape
    '--primary-radius': import.meta.env.VITE_THEME_PRIMARY_RADIUS,
  },
};
