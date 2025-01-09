import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {Schema, ValidateEnv} from '@julr/vite-plugin-validate-env'
import eslint from 'vite-plugin-eslint'
import fs from 'fs'
import path from 'path'

const customLogoDir : string = path.join(__dirname, 'src', 'assets', 'logos')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ValidateEnv({
      VITE_AT_CLIENT_ID: Schema.string({
        message: 'Client ID of the frontend Azure application'
      }),
      VITE_AT_TENANT_ID: Schema.string({
        message: 'Tenant ID of the target Azure account'
      }),
      VITE_REACT_API_URL: Schema.string({
        message: 'URL of the backend API'
      }),
      VITE_API_SCOPE: Schema.string({
        message: "Scope URI for API application"
      }),
      VITE_THEME_PRIMARY_MAIN: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryMain)
      },
      VITE_THEME_SECONDARY_MAIN: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain)
      },
      VITE_THEME_PRIMARY_GREY: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey)
      },
      VITE_THEME_SECONDARY_DARK_GREY: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryDarkGrey)
      },
      VITE_THEME_SECONDARY_LIGHT_GREY: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryLightGrey)
      },
      VITE_THEME_SECONDARY_TEAL: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryTeal)
      },
      VITE_THEME_SECONDARY_LIGHT_GREEN: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryLightGreen)
      },
      VITE_THEME_SECONDARY_DARK_GREEN: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryDarkGreen)
      },
      VITE_THEME_SECONDARY_BLUE: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryBlue)
      },
      VITE_THEME_SECONDARY_PURPLE: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryPurple)
      },
      VITE_THEME_SECONDARY_ORANGE: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryOrange)
      },
      VITE_THEME_SECONDARY_RED: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryRed)
      },
      VITE_THEME_SECONDARY_YELLOW: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryYellow)
      },
      VITE_THEME_BACKGROUND: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.Background)
      },
      VITE_THEME_SECONDARY_MAIN_50: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain50)
      },
      VITE_THEME_SECONDARY_MAIN_100: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain100)
      },
      VITE_THEME_SECONDARY_MAIN_200: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain200)
      },
      VITE_THEME_SECONDARY_MAIN_300: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain300)
      },
      VITE_THEME_SECONDARY_MAIN_400: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain400)
      },
      VITE_THEME_SECONDARY_MAIN_500: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain500)
      },
      VITE_THEME_SECONDARY_MAIN_600: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain600)
      },
      VITE_THEME_SECONDARY_MAIN_700: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain700)
      },
      VITE_THEME_SECONDARY_MAIN_800: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain800)
      },
      VITE_THEME_SECONDARY_MAIN_900: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryMain900)
      },
      VITE_THEME_PRIMARY_GREY_50: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey50)
      },
      VITE_THEME_PRIMARY_GREY_100: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey100)
      },
      VITE_THEME_PRIMARY_GREY_200: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey200)
      },
      VITE_THEME_PRIMARY_GREY_300: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey300)
      },
      VITE_THEME_PRIMARY_GREY_400: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey400)
      },
      VITE_THEME_PRIMARY_GREY_500: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey500)
      },
      VITE_THEME_PRIMARY_GREY_600: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey600)
      },
      VITE_THEME_PRIMARY_GREY_700: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey700)
      },
      VITE_THEME_PRIMARY_GREY_800: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey800)
      },
      VITE_THEME_PRIMARY_GREY_900: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey900)
      },
      VITE_THEME_PRIMARY_MAIN_BG: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryMainBackground)
      },
      VITE_THEME_PRIMARY_RADIUS: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryRadius)
      },
      VITE_LOGO_PATH: (key, value) => {
        return defaultCustomLogoValue(key, value, LogoDefaultValues.Logo)
      },
      VITE_LOGO_SMALL_PATH: (key, value) => {
        return defaultCustomLogoValue(key, value, LogoDefaultValues.LogoSmall)
      },
      VITE_BRANDING_NAME: (key, value) => {
        return defaultConfigValue(key, value, BrandingDefaultValues.Name)
      },
      VITE_BRANDING_TAGLINE_1: (key, value) => {
        return defaultConfigValue(key, value, BrandingDefaultValues.Tagline1)
      },
      VITE_BRANDING_TAGLINE_2: (key, value) => {
        return defaultConfigValue(key, value, BrandingDefaultValues.Tagline2)
      },
      VITE_DOCS_URL: (key, value) => {
        return defaultConfigValue(key, value, DocsDefaultValues.Url)
      },
}),
    {
      apply: 'build',
      ...eslint({
        failOnWarning: true,
        failOnError: true,
      })
    }
  ]
})

function defaultCustomLogoValue(key: string, value: string, defaultValue: string) {
  value = defaultConfigValue(key, value, defaultValue);
  const logoPath: string = path.join(customLogoDir, value);
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Custom logo at ${logoPath} does not exist`);
  }
  return value;
}

function defaultConfigValue(key: string, value: string, defaultValue: string): string {
  if (!value) {
    console.warn(`Defaulting ${key} value to ${defaultValue}`)
    value = defaultValue
  }
  return value
}

enum ThemeDefaultValues {
  PrimaryMain = '#0a3546',
  SecondaryMain = '#90CA6D',
  PrimaryGrey = '#F6F7F8',
  SecondaryDarkGrey = '#353333',
  SecondaryLightGrey = '#B3B3B3',
  SecondaryTeal = '#3E7784',
  SecondaryLightGreen = '#68934B',
  SecondaryDarkGreen = '#375C2B',
  SecondaryBlue = '#014F86',
  SecondaryPurple = '#B9A8D2',
  SecondaryOrange = '#D7534C',
  SecondaryRed = '#A81E2C',
  SecondaryYellow = '#FCAF17',
  Background = '#FFFFFF',
  SecondaryMain50 = '#e8f5e9',
  SecondaryMain100 = '#c8e6c9',
  SecondaryMain200 = '#a5d6a7',
  SecondaryMain300 = '#81c784',
  SecondaryMain400 = '#66bb6a',
  SecondaryMain500 = '#4caf50',
  SecondaryMain600 = '#43a047',
  SecondaryMain700 = '#388e3c',
  SecondaryMain800 = '#2e7d32',
  SecondaryMain900 = '#1b5e20',
  PrimaryGrey50 = '#fafafa', 
  PrimaryGrey100 = '#f5f5f5', 
  PrimaryGrey200 = '#eeeeee', 
  PrimaryGrey300 = '#e0e0e0', 
  PrimaryGrey400 = '#bdbdbd', 
  PrimaryGrey500 = '#9e9e9e', 
  PrimaryGrey600 = '#757575', 
  PrimaryGrey700 = '#616161', 
  PrimaryGrey800 = '#424242', 
  PrimaryGrey900 = '#212121',
  PrimaryMainBackground = '#eef2f6',
  PrimaryRadius = '5px',
}

enum LogoDefaultValues {
  Logo = "AusTrakka_Logo_cmyk.png",
  LogoSmall = "AusTrakka_Logo_only_cmyk.png",
}

enum BrandingDefaultValues {
  Name = "AusTrakka",
  Tagline1 = "From genomics to public health decisions for Australia",
  Tagline2 = "Combining Genomics & Epidemiological Data",
}

enum DocsDefaultValues {
  Url = "https://docs.austrakka.net",
}
