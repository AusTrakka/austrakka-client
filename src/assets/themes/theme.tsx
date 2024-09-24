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

export const globalStyles = {
  ':root': {
    // material-ui
    '--primary-blue': import.meta.env.VITE_THEME_PRIMARY_BLUE_HEX,
    '--primary-green': import.meta.env.VITE_THEME_PRIMARY_GREEN_HEX,
    '--primary-grey': import.meta.env.VITE_THEME_PRIMARY_GREY_HEX,
    '--secondary-dark-grey': import.meta.env.VITE_THEME_SECONDARY_DARK_GREY_HEX,
    '--secondary-light-grey': import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREY_HEX,
    '--secondary-teal': import.meta.env.VITE_THEME_SECONDARY_TEAL_HEX,
    '--secondary-light-green': import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREEN_HEX,
    '--secondary-dark-green': import.meta.env.VITE_THEME_SECONDARY_DARK_GREEN_HEX,
    '--secondary-blue': import.meta.env.VITE_THEME_SECONDARY_BLUE_HEX,
    '--secondary-purple': import.meta.env.VITE_THEME_SECONDARY_PURPLE_HEX,
    '--secondary-orange': import.meta.env.VITE_THEME_SECONDARY_ORANGE_HEX,
    '--secondary-red': import.meta.env.VITE_THEME_SECONDARY_RED_HEX,
    '--secondary-yellow': import.meta.env.VITE_THEME_SECONDARY_YELLOW_HEX,
    // TODO: this should never have been a hex, either light or dark
    'color-scheme': import.meta.env.VITE_THEME_BACKGROUND_HEX,
    // primereact
    '--primary-50': import.meta.env.VITE_THEME_PRIMARY_GREEN_50_HEX,
    '--primary-100': import.meta.env.VITE_THEME_PRIMARY_GREEN_100_HEX,
    '--primary-200': import.meta.env.VITE_THEME_PRIMARY_GREEN_200_HEX,
    '--primary-300': import.meta.env.VITE_THEME_PRIMARY_GREEN_300_HEX,
    '--primary-400': import.meta.env.VITE_THEME_PRIMARY_GREEN_400_HEX,
    '--primary-500': import.meta.env.VITE_THEME_PRIMARY_GREEN_500_HEX,
    '--primary-600': import.meta.env.VITE_THEME_PRIMARY_GREEN_600_HEX,
    '--primary-700': import.meta.env.VITE_THEME_PRIMARY_GREEN_700_HEX,
    '--primary-800': import.meta.env.VITE_THEME_PRIMARY_GREEN_800_HEX,
    '--primary-900': import.meta.env.VITE_THEME_PRIMARY_GREEN_900_HEX,
    // austrakka
    '--background-colour': import.meta.env.VITE_THEME_BACKGROUND_HEX,
    '--primary-grey-50': import.meta.env.VITE_THEME_PRIMARY_GREY_50_HEX,
    '--primary-grey-100': import.meta.env.VITE_THEME_PRIMARY_GREY_100_HEX,
    '--primary-grey-200': import.meta.env.VITE_THEME_PRIMARY_GREY_200_HEX,
    '--primary-grey-300': import.meta.env.VITE_THEME_PRIMARY_GREY_300_HEX,
    '--primary-grey-400': import.meta.env.VITE_THEME_PRIMARY_GREY_400_HEX,
    '--primary-grey-500': import.meta.env.VITE_THEME_PRIMARY_GREY_500_HEX,
    '--primary-grey-600': import.meta.env.VITE_THEME_PRIMARY_GREY_600_HEX,
    '--primary-grey-700': import.meta.env.VITE_THEME_PRIMARY_GREY_700_HEX,
    '--primary-grey-800': import.meta.env.VITE_THEME_PRIMARY_GREY_800_HEX,
    '--primary-grey-900': import.meta.env.VITE_THEME_PRIMARY_GREY_900_HEX,
    '--primary-blue-bg': import.meta.env.VITE_THEME_PRIMARY_BLUE_BG_HEX,
  },
};
