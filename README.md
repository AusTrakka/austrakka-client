# austrakka-client

## Linting code

Run the following to lint code: `npm run lint`.

We should endeavour to get this error/warning list down to 0.
An `import/no-unresolved` error has already been the cause of a breaking build on Linux systems

To automatically fix certain linting errors, use `npx eslint . --fix`

## Environment Variables

These can also be set in a `.env` file in the root directory.

| Name                                 | Description                                                |
|--------------------------------------|------------------------------------------------------------|
| VITE_AT_CLIENT_ID                    | Guid for target AusTrakka client app                       |
| VITE_AT_TENANT_ID                    | Guid for target Azure Tenant                               |
| VITE_REACT_API_URL                   | The backend API url                                        |
| VITE_API_SCOPE                       | Scope URI for API application                              |
| VITE_API_SCOPE                       | Scope URI for API application                              |
| VITE_THEME_PRIMARY_BLUE_HEX          | Theme hex colour for css variable `--primary-blue`         |
| VITE_THEME_PRIMARY_GREEN_HEX         | Theme hex colour for css variable `--primary-green`        |
| VITE_THEME_PRIMARY_GREY_HEX          | Theme hex colour for css variable `--primary-grey`         |
| VITE_THEME_SECONDARY_DARK_GREY_HEX   | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_SECONDARY_LIGHT_GREY_HEX  | Theme hex colour for css variable `--secondary-light-grey` |
| VITE_THEME_SECONDARY_TEAL_HEX        | Theme hex colour for css variable `--secondary-teal`       |
| VITE_THEME_SECONDARY_LIGHT_GREEN_HEX | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_SECONDARY_DARK_GREEN_HEX  | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_SECONDARY_BLUE_HEX        | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_SECONDARY_PURPLE_HEX      | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_SECONDARY_ORANGE_HEX      | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_SECONDARY_RED_HEX         | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_SECONDARY_YELLOW_HEX      | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_BACKGROUND_HEX            | Theme hex colour for css variable `--secondary-dark-grey`  |
| VITE_THEME_PRIMARY_GREEN_50_HEX      | Theme hex colour for css variable `--primary-50`           |
| VITE_THEME_PRIMARY_GREEN_100_HEX     | Theme hex colour for css variable `--primary-100`          |
| VITE_THEME_PRIMARY_GREEN_200_HEX     | Theme hex colour for css variable `--primary-200`          |
| VITE_THEME_PRIMARY_GREEN_300_HEX     | Theme hex colour for css variable `--primary-300`          |
| VITE_THEME_PRIMARY_GREEN_400_HEX     | Theme hex colour for css variable `--primary-400`          |
| VITE_THEME_PRIMARY_GREEN_500_HEX     | Theme hex colour for css variable `--primary-500`          |
| VITE_THEME_PRIMARY_GREEN_600_HEX     | Theme hex colour for css variable `--primary-600`          |
| VITE_THEME_PRIMARY_GREEN_700_HEX     | Theme hex colour for css variable `--primary-700`          |
| VITE_THEME_PRIMARY_GREEN_800_HEX     | Theme hex colour for css variable `--primary-800`          |
| VITE_THEME_PRIMARY_GREEN_900_HEX     | Theme hex colour for css variable `--primary-900`          |
