/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AT_CLIENT_ID: string
  readonly VITE_AT_TENANT_ID: string
  readonly VITE_REACT_API_URL: string
  readonly VITE_API_SCOPE: string
  // The VITE_THEME_[name] env vars must map to terraform output `colour_scheme.[name]`.
  readonly VITE_THEME_PRIMARY_BLUE: string
  readonly VITE_THEME_PRIMARY_GREEN: string
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
  readonly VITE_THEME_PRIMARY_GREEN_50: string
  readonly VITE_THEME_PRIMARY_GREEN_100: string
  readonly VITE_THEME_PRIMARY_GREEN_200: string
  readonly VITE_THEME_PRIMARY_GREEN_300: string
  readonly VITE_THEME_PRIMARY_GREEN_400: string
  readonly VITE_THEME_PRIMARY_GREEN_500: string
  readonly VITE_THEME_PRIMARY_GREEN_600: string
  readonly VITE_THEME_PRIMARY_GREEN_700: string
  readonly VITE_THEME_PRIMARY_GREEN_800: string
  readonly VITE_THEME_PRIMARY_GREEN_900: string
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
  readonly VITE_THEME_PRIMARY_BLUE_BG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
