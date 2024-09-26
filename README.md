# austrakka-client

## Linting code

Run the following to lint code: `npm run lint`.

We should endeavour to get this error/warning list down to 0.
An `import/no-unresolved` error has already been the cause of a breaking build on Linux systems

To automatically fix certain linting errors, use `npx eslint . --fix`

## Environment Variables

These can also be set in a `.env` file in the root directory.

| Name                             | Description                                             |
|----------------------------------|---------------------------------------------------------|
| VITE_AT_CLIENT_ID                | Guid for target AusTrakka client app                    |
| VITE_AT_TENANT_ID                | Guid for target Azure Tenant                            |
| VITE_REACT_API_URL               | The backend API url                                     |
| VITE_API_SCOPE                   | Scope URI for API application                           |
| VITE_API_SCOPE                   | Scope URI for API application                           |
| VITE_THEME_PRIMARY_BLUE          | Hex colour for css variable `--primary-blue`            |
| VITE_THEME_PRIMARY_GREEN         | Hex colour for css variable `--primary-green`           |
| VITE_THEME_PRIMARY_GREY          | Hex colour for css variable `--primary-grey`            |
| VITE_THEME_SECONDARY_DARK_GREY   | Hex colour for css variable `--secondary-dark-grey`     |
| VITE_THEME_SECONDARY_LIGHT_GREY  | Hex colour for css variable `--secondary-light-grey`    |
| VITE_THEME_SECONDARY_TEAL        | Hex colour for css variable `--secondary-teal`          |
| VITE_THEME_SECONDARY_LIGHT_GREEN | Hex colour for css variable `--secondary-light-green`   |
| VITE_THEME_SECONDARY_DARK_GREEN  | Hex colour for css variable `--secondary-dark-green`    |
| VITE_THEME_SECONDARY_BLUE        | Hex colour for css variable `--secondary-blue`          |
| VITE_THEME_SECONDARY_PURPLE      | Hex colour for css variable `--secondary-purple`        |
| VITE_THEME_SECONDARY_ORANGE      | Hex colour for css variable `--secondary-ornage`        |
| VITE_THEME_SECONDARY_RED         | Hex colour for css variable `--secondary-red`           |
| VITE_THEME_SECONDARY_YELLOW      | Hex colour for css variable `--secondary-yellow`        |
| VITE_THEME_PRIMARY_GREEN_50      | Hex colour for css variable `--primary-50`              |
| VITE_THEME_PRIMARY_GREEN_100     | Hex colour for css variable `--primary-100`             |
| VITE_THEME_PRIMARY_GREEN_200     | Hex colour for css variable `--primary-200`             |
| VITE_THEME_PRIMARY_GREEN_300     | Hex colour for css variable `--primary-300`             |
| VITE_THEME_PRIMARY_GREEN_400     | Hex colour for css variable `--primary-400`             |
| VITE_THEME_PRIMARY_GREEN_500     | Hex colour for css variable `--primary-500`             |
| VITE_THEME_PRIMARY_GREEN_600     | Hex colour for css variable `--primary-600`             |
| VITE_THEME_PRIMARY_GREEN_700     | Hex colour for css variable `--primary-700`             |
| VITE_THEME_PRIMARY_GREEN_800     | Hex colour for css variable `--primary-800`             |
| VITE_THEME_PRIMARY_GREEN_900     | Hex colour for css variable `--primary-900`             |
| VITE_THEME_BACKGROUND            | Hex colour for css variable `--background-colour`       |
| VITE_THEME_PRIMARY_GREY_50       | Hex colour for css variable `--primary-grey-50`         |
| VITE_THEME_PRIMARY_GREY_100      | Hex colour for css variable `--primary-grey-100`        |
| VITE_THEME_PRIMARY_GREY_200      | Hex colour for css variable `--primary-grey-200`        |
| VITE_THEME_PRIMARY_GREY_300      | Hex colour for css variable `--primary-grey-300`        |
| VITE_THEME_PRIMARY_GREY_400      | Hex colour for css variable `--primary-grey-400`        |
| VITE_THEME_PRIMARY_GREY_500      | Hex colour for css variable `--primary-grey-500`        |
| VITE_THEME_PRIMARY_GREY_600      | Hex colour for css variable `--primary-grey-600`        |
| VITE_THEME_PRIMARY_GREY_700      | Hex colour for css variable `--primary-grey-700`        |
| VITE_THEME_PRIMARY_GREY_800      | Hex colour for css variable `--primary-grey-800`        |
| VITE_THEME_PRIMARY_GREY_900      | Hex colour for css variable `--primary-grey-900`        |
| VITE_THEME_PRIMARY_BLUE_BG       | Hex colour for css variable `--primary-blue-bg`         |
| VITE_LOGO_PATH                   | Path under `./src/assets/logos/` for logo.              |
| VITE_LOGO_SMALL_PATH             | Path under `./src/assets/logos/` for small square logo. |
| VITE_BRANDING_NAME               | Name of the application.                                |
| VITE_BRANDING_TAGLINE_1          | First tagline used on the landing page.                 |
| VITE_BRANDING_TAGLINE_2          | Second tagline used on the langing page.                |

## Colours and themes.

Any element that needs to be explicitly coloured should use the css variables defined in `src/assets/themes/theme.tsx:globalStyles`.
This ensures that any environment that specifies it's own colour scheme will be handled.

Currently the theme is determined at build time based on environment variables.
However in the future if we need to allow for changing of themes dynamically (including dark mode), 
we can migrate `src/assets/themes/theme.tsx:globalStyles` to be a list of css variable sets, place it in the react state
and allow for user selection of one set of variables.
It probably still makes sense for each environment to define the default theme at build time using the environment variables.
