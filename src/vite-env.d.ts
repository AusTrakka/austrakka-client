/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AT_CLIENT_ID: string
  readonly VITE_AT_TENANT_ID: string
  readonly VITE_REACT_API_URL: string
  readonly VITE_API_SCOPE: string
  // The VITE_THEME_[name] env vars must map to terraform output `colour_scheme.[name]`.
  readonly VITE_THEME_PRIMARY_MAIN: string
  readonly VITE_THEME_SECONDARY_MAIN: string
  readonly VITE_THEME_PRIMARY_GREY: string
  readonly VITE_THEME_SECONDARY_DARK_GREY: string
  readonly VITE_THEME_SECONDARY_LIGHT_GREY: string
  readonly VITE_THEME_SECONDARY_TEAL: string
  readonly VITE_THEME_SECONDARY_LIGHT_GREEN: string
  readonly VITE_THEME_SECONDARY_DARK_GREEN: string
  readonly VITE_THEME_SECONDARY_BLUE: string
  readonly VITE_THEME_SECONDARY_PURPLE: string
  readonly VITE_THEME_SECONDARY_ORANGE: string
  readonly VITE_THEME_SECONDARY_RED: string
  readonly VITE_THEME_SECONDARY_YELLOW: string
  readonly VITE_THEME_BACKGROUND: string
  readonly VITE_THEME_SECONDARY_MAIN_50: string
  readonly VITE_THEME_SECONDARY_MAIN_100: string
  readonly VITE_THEME_SECONDARY_MAIN_200: string
  readonly VITE_THEME_SECONDARY_MAIN_300: string
  readonly VITE_THEME_SECONDARY_MAIN_400: string
  readonly VITE_THEME_SECONDARY_MAIN_500: string
  readonly VITE_THEME_SECONDARY_MAIN_600: string
  readonly VITE_THEME_SECONDARY_MAIN_700: string
  readonly VITE_THEME_SECONDARY_MAIN_800: string
  readonly VITE_THEME_SECONDARY_MAIN_900: string
  readonly VITE_THEME_PRIMARY_GREY_50: string
  readonly VITE_THEME_PRIMARY_GREY_100: string
  readonly VITE_THEME_PRIMARY_GREY_200: string
  readonly VITE_THEME_PRIMARY_GREY_300: string
  readonly VITE_THEME_PRIMARY_GREY_400: string
  readonly VITE_THEME_PRIMARY_GREY_500: string
  readonly VITE_THEME_PRIMARY_GREY_600: string
  readonly VITE_THEME_PRIMARY_GREY_700: string
  readonly VITE_THEME_PRIMARY_GREY_800: string
  readonly VITE_THEME_PRIMARY_GREY_900: string
  readonly VITE_THEME_PRIMARY_MAIN_BG: string
  // Logo paths must be relative src/assets/logos
  readonly VITE_LOGO_PATH: string
  readonly VITE_LOGO_SMALL_PATH: string
  // Branding
  readonly VITE_BRANDING_NAME: string
  readonly VITE_BRANDING_TAGLINE_1: string
  readonly VITE_BRANDING_TAGLINE_2: string
  // Docs
  readonly VITE_DOCS_URL: string
  readonly VITE_DOCS_ENABLED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
