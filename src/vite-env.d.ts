/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AT_CLIENT_ID: string
  readonly VITE_AT_TENANT_ID: string
  readonly VITE_REACT_API_URL: string
  readonly VITE_API_SCOPE: string
  // The VITE_THEME_[name]_HEX env vars must map to terraform output `colour_scheme.[name]`.
  readonly VITE_THEME_PRIMARY_BLUE_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_HEX: string
  readonly VITE_THEME_SECONDARY_DARK_GREY_HEX: string
  readonly VITE_THEME_SECONDARY_LIGHT_GREY_HEX: string
  readonly VITE_THEME_SECONDARY_TEAL_HEX: string
  readonly VITE_THEME_SECONDARY_LIGHT_GREEN_HEX: string
  readonly VITE_THEME_SECONDARY_DARK_GREEN_HEX: string
  readonly VITE_THEME_SECONDARY_BLUE_HEX: string
  readonly VITE_THEME_SECONDARY_PURPLE_HEX: string
  readonly VITE_THEME_SECONDARY_ORANGE_HEX: string
  readonly VITE_THEME_SECONDARY_RED_HEX: string
  readonly VITE_THEME_SECONDARY_YELLOW_HEX: string
  readonly VITE_THEME_BACKGROUND_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_50_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_100_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_200_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_300_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_400_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_500_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_600_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_700_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_800_HEX: string
  readonly VITE_THEME_PRIMARY_GREEN_900_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_50_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_100_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_200_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_300_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_400_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_500_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_600_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_700_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_800_HEX: string
  readonly VITE_THEME_PRIMARY_GREY_900_HEX: string
  readonly VITE_THEME_PRIMARY_BLUE_BG_HEX: string
  // Logo paths must be relative src/assets/logos
  readonly VITE_LOGO_PATH: string
  readonly VITE_LOGO_SMALL_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
