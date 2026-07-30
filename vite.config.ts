import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Schema, ValidateEnv } from '@julr/vite-plugin-validate-env'
import fs from 'fs'
import path from 'path'

const customLogoDir: string = path.join(__dirname, 'src', 'assets', 'logos')

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
      VITE_BRANDING_SIDEBAR_NAME_ENABLED: (key, value) => {
        return defaultConfigValueBoolean(key, value, BrandingDefaultValues.SidebarNameEnabled)
      },
      VITE_BRANDING_ID: (key, value) => {
        return defaultConfigValue(key, value, BrandingDefaultValues.Id)
      },
      VITE_DOCS_URL: (key, value) => {
        return defaultConfigValue(key, value, DocsDefaultValues.Url)
      },
    }),
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

function defaultConfigValueBoolean(key: string, value: string, defaultValue: string): string {
  if (value !== undefined && value !== "") {
    if (!["true", "false"].includes(value.toLowerCase())) {
      throw new Error(`Value of ${value} for ${key}. Must be 'true' or 'false'`)
    }
  }
  return Boolean(defaultConfigValue(key, value, defaultValue).toLowerCase() === "true").toString()
}

enum ThemeDefaultValues {
  PrimaryMain = '#1C1C28',
  SecondaryMain = '#3D5FA0',
  PrimaryGrey = '#F4F5F8',
  SecondaryDarkGrey = '#3E4352',
  SecondaryLightGrey = '#B3B6C2',
  SecondaryTeal = '#3A9E82',
  SecondaryLightGreen = '#52A87A',
  SecondaryDarkGreen = '#2F6E4E',
  SecondaryBlue = '#3B82C4',
  SecondaryPurple = '#7B6FC4',
  SecondaryOrange = '#C4622A',
  SecondaryRed = '#C0395A',
  SecondaryYellow = '#DDB830',
  Background = '#F7F8FB',
  SecondaryMain50 = '#ECF0F9',
  SecondaryMain100 = '#C5CEEC',
  SecondaryMain200 = '#96A8DB',
  SecondaryMain300 = '#6280C4',
  SecondaryMain400 = '#3D5FA0',
  SecondaryMain500 = '#2E4A82',
  SecondaryMain600 = '#213666',
  SecondaryMain700 = '#15244A',
  SecondaryMain800 = '#0C1530',
  SecondaryMain900 = '#060A1A',
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
  PrimaryMainBackground = '#EEF0F7',
}

enum LogoDefaultValues {
  Logo = "trakka_logo.webp",
  LogoSmall = "trakka_logo_small.webp",
}

enum BrandingDefaultValues {
  Name = "Trakka",
  Tagline1 = "From genomics to public health decisions",
  Tagline2 = "",
  SidebarNameEnabled = "false",
  Id = "aardvark",
}

enum DocsDefaultValues {
  Url = "https://docs.trakka.org",
}
