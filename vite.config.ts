import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Schema, ValidateEnv } from '@julr/vite-plugin-validate-env'
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
