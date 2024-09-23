import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {Schema, ValidateEnv} from '@julr/vite-plugin-validate-env'
import eslint from 'vite-plugin-eslint'

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
      VITE_THEME_PRIMARY_BLUE_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryBlue)
      },
      VITE_THEME_PRIMARY_GREEN_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen)
      },
      VITE_THEME_PRIMARY_GREY_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGrey)
      },
      VITE_THEME_SECONDARY_DARK_GREY_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryDarkGrey)
      },
      VITE_THEME_SECONDARY_LIGHT_GREY_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryLightGrey)
      },
      VITE_THEME_SECONDARY_TEAL_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryTeal)
      },
      VITE_THEME_SECONDARY_LIGHT_GREEN_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryLightGreen)
      },
      VITE_THEME_SECONDARY_DARK_GREEN_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryDarkGreen)
      },
      VITE_THEME_SECONDARY_BLUE_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryBlue)
      },
      VITE_THEME_SECONDARY_PURPLE_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryPurple)
      },
      VITE_THEME_SECONDARY_ORANGE_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryOrange)
      },
      VITE_THEME_SECONDARY_RED_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryRed)
      },
      VITE_THEME_SECONDARY_YELLOW_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.SecondaryYellow)
      },
      VITE_THEME_BACKGROUND_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.Background)
      },
      VITE_THEME_PRIMARY_GREEN_50_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen50)
      },
      VITE_THEME_PRIMARY_GREEN_100_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen100)
      },
      VITE_THEME_PRIMARY_GREEN_200_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen200)
      },
      VITE_THEME_PRIMARY_GREEN_300_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen300)
      },
      VITE_THEME_PRIMARY_GREEN_400_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen400)
      },
      VITE_THEME_PRIMARY_GREEN_500_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen500)
      },
      VITE_THEME_PRIMARY_GREEN_600_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen600)
      },
      VITE_THEME_PRIMARY_GREEN_700_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen700)
      },
      VITE_THEME_PRIMARY_GREEN_800_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen800)
      },
      VITE_THEME_PRIMARY_GREEN_900_HEX: (key, value) => {
        return defaultConfigValue(key, value, ThemeDefaultValues.PrimaryGreen900)
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

function defaultConfigValue(key: string, value: string, defaultValue: string): string {
  if (!value) {
    console.warn(`Defaulting ${key} value to ${defaultValue}`)
    value = defaultValue
  }
  return value
}

enum ThemeDefaultValues {
  PrimaryBlue = '#0a3546',
  PrimaryGreen = '#90CA6D',
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
  PrimaryGreen50 = '#e8f5e9',
  PrimaryGreen100 = '#c8e6c9',
  PrimaryGreen200 = '#a5d6a7',
  PrimaryGreen300 = '#81c784',
  PrimaryGreen400 = '#66bb6a',
  PrimaryGreen500 = '#4caf50',
  PrimaryGreen600 = '#43a047',
  PrimaryGreen700 = '#388e3c',
  PrimaryGreen800 = '#2e7d32',
  PrimaryGreen900 = '#1b5e20',
}
