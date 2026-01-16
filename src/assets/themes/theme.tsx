import { createTheme } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

export const Theme = Object.freeze({
  PrimaryMain: import.meta.env.VITE_THEME_PRIMARY_MAIN,
  SecondaryMain: import.meta.env.VITE_THEME_SECONDARY_MAIN,

  PrimaryGrey: import.meta.env.VITE_THEME_PRIMARY_GREY,
  SecondaryDarkGrey: import.meta.env.VITE_THEME_SECONDARY_DARK_GREY,
  SecondaryLightGrey: import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREY,

  SecondaryTeal: import.meta.env.VITE_THEME_SECONDARY_TEAL,
  SecondaryLightGreen: import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREEN,
  SecondaryDarkGreen: import.meta.env.VITE_THEME_SECONDARY_DARK_GREEN,
  SecondaryBlue: import.meta.env.VITE_THEME_SECONDARY_BLUE,
  SecondaryPurple: import.meta.env.VITE_THEME_SECONDARY_PURPLE,
  SecondaryOrange: import.meta.env.VITE_THEME_SECONDARY_ORANGE,
  SecondaryRed: import.meta.env.VITE_THEME_SECONDARY_RED,
  SecondaryYellow: import.meta.env.VITE_THEME_SECONDARY_YELLOW,

  Background: import.meta.env.VITE_THEME_BACKGROUND,

  SecondaryMain50: import.meta.env.VITE_THEME_SECONDARY_MAIN_50,
  SecondaryMain100: import.meta.env.VITE_THEME_SECONDARY_MAIN_100,
  SecondaryMain200: import.meta.env.VITE_THEME_SECONDARY_MAIN_200,
  SecondaryMain300: import.meta.env.VITE_THEME_SECONDARY_MAIN_300,
  SecondaryMain400: import.meta.env.VITE_THEME_SECONDARY_MAIN_400,
  SecondaryMain500: import.meta.env.VITE_THEME_SECONDARY_MAIN_500,
  SecondaryMain600: import.meta.env.VITE_THEME_SECONDARY_MAIN_600,
  SecondaryMain700: import.meta.env.VITE_THEME_SECONDARY_MAIN_700,
  SecondaryMain800: import.meta.env.VITE_THEME_SECONDARY_MAIN_800,
  SecondaryMain900: import.meta.env.VITE_THEME_SECONDARY_MAIN_900,

  PrimaryGrey50: import.meta.env.VITE_THEME_PRIMARY_GREY_50,
  PrimaryGrey100: import.meta.env.VITE_THEME_PRIMARY_GREY_100,
  PrimaryGrey200: import.meta.env.VITE_THEME_PRIMARY_GREY_200,
  PrimaryGrey300: import.meta.env.VITE_THEME_PRIMARY_GREY_300,
  PrimaryGrey400: import.meta.env.VITE_THEME_PRIMARY_GREY_400,
  PrimaryGrey500: import.meta.env.VITE_THEME_PRIMARY_GREY_500,
  PrimaryGrey600: import.meta.env.VITE_THEME_PRIMARY_GREY_600,
  PrimaryGrey700: import.meta.env.VITE_THEME_PRIMARY_GREY_700,
  PrimaryGrey800: import.meta.env.VITE_THEME_PRIMARY_GREY_800,
  PrimaryGrey900: import.meta.env.VITE_THEME_PRIMARY_GREY_900,

  PrimaryMainBackground: import.meta.env.VITE_THEME_PRIMARY_MAIN_BG,
});

// INFO: useful if we ever want to refer to the colours in a method.
export type ThemeTokens = typeof Theme;

const muiTheme: ThemeOptions = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: Theme.PrimaryMain,
    },
    secondary: {
      main: Theme.SecondaryMain,
    },
    background: {
      // @ts-ignore
      main: Theme.Background,
    },
    success: {
      main: Theme.SecondaryLightGreen,
    },
    error: {
      main: Theme.SecondaryRed,
    },
    warning: {
      main: Theme.SecondaryYellow,
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

export default muiTheme;

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
    '--primary-main': Theme.PrimaryMain,
    '--primary-main-rgb': hexToRgb(Theme.PrimaryMain),
    '--secondary-main': Theme.SecondaryMain,
    '--secondary-main-rgb': hexToRgb(Theme.SecondaryMain),
    '--primary-grey': Theme.PrimaryGrey,
    '--secondary-dark-grey': Theme.SecondaryDarkGrey,
    '--secondary-light-grey': Theme.SecondaryLightGrey,
    '--secondary-teal': Theme.SecondaryTeal,
    '--secondary-light-green': Theme.SecondaryLightGreen,
    '--secondary-dark-green': Theme.SecondaryDarkGreen,
    '--secondary-blue': Theme.SecondaryBlue,
    '--secondary-purple': Theme.SecondaryPurple,
    '--secondary-orange': Theme.SecondaryOrange,
    '--secondary-red': Theme.SecondaryRed,
    '--secondary-yellow': Theme.SecondaryYellow,
    'colorScheme': 'light',

    // primereact
    '--primary-50': Theme.SecondaryMain50,
    '--primary-100': Theme.SecondaryMain100,
    '--primary-200': Theme.SecondaryMain200,
    '--primary-300': Theme.SecondaryMain300,
    '--primary-400': Theme.SecondaryMain400,
    '--primary-500': Theme.SecondaryMain500,
    '--primary-600': Theme.SecondaryMain600,
    '--primary-700': Theme.SecondaryMain700,
    '--primary-800': Theme.SecondaryMain800,
    '--primary-900': Theme.SecondaryMain900,

    // austrakka
    '--background-colour': Theme.Background,
    '--primary-grey-50': Theme.PrimaryGrey50,
    '--primary-grey-100': Theme.PrimaryGrey100,
    '--primary-grey-200': Theme.PrimaryGrey200,
    '--primary-grey-300': Theme.PrimaryGrey300,
    '--primary-grey-400': Theme.PrimaryGrey400,
    '--primary-grey-500': Theme.PrimaryGrey500,
    '--primary-grey-600': Theme.PrimaryGrey600,
    '--primary-grey-700': Theme.PrimaryGrey700,
    '--primary-grey-800': Theme.PrimaryGrey800,
    '--primary-grey-900': Theme.PrimaryGrey900,
    '--primary-main-bg': Theme.PrimaryMainBackground,
  },
};

// INFO:   Local quick reference
//
//   PrimaryMain = '#0a3546',
//   SecondaryMain = '#90CA6D',
//   PrimaryGrey = '#F6F7F8',
//   SecondaryDarkGrey = '#353333',
//   SecondaryLightGrey = '#B3B3B3',
//   SecondaryTeal = '#3E7784',
//   SecondaryLightGreen = '#68934B',
//   SecondaryDarkGreen = '#375C2B',
//   SecondaryBlue = '#014F86',
//   SecondaryPurple = '#B9A8D2',
//   SecondaryOrange = '#D7534C',
//   SecondaryRed = '#A81E2C',
//   SecondaryYellow = '#FCAF17',
//   Background = '#FFFFFF',
//   SecondaryMain50 = '#e8f5e9',
//   SecondaryMain100 = '#c8e6c9',
//   SecondaryMain200 = '#a5d6a7',
//   SecondaryMain300 = '#81c784',
//   SecondaryMain400 = '#66bb6a',
//   SecondaryMain500 = '#4caf50',
//   SecondaryMain600 = '#43a047',
//   SecondaryMain700 = '#388e3c',
//   SecondaryMain800 = '#2e7d32',
//   SecondaryMain900 = '#1b5e20',
//   PrimaryGrey50 = '#fafafa', 
//   PrimaryGrey100 = '#f5f5f5', 
//   PrimaryGrey200 = '#eeeeee', 
//   PrimaryGrey300 = '#e0e0e0', 
//   PrimaryGrey400 = '#bdbdbd', 
//   PrimaryGrey500 = '#9e9e9e', 
//   PrimaryGrey600 = '#757575', 
//   PrimaryGrey700 = '#616161', 
//   PrimaryGrey800 = '#424242', 
//   PrimaryGrey900 = '#212121',
//   PrimaryMainBackground = '#eef2f6',
