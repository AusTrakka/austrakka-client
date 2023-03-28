/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AT_CLIENT_ID: string
  readonly VITE_AT_TENANT_ID: string
  readonly VITE_REACT_API_URL: string
  readonly VITE_API_SCOPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
