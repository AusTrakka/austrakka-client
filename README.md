# austrakka-client

## Linting code

Run the following to lint code: `npm run lint`.

We should endeavour to get this error/warning list down to 0.
An `import/no-unresolved` error has already been the cause of a breaking build on Linux systems

To automatically fix certain linting errors, use `npx eslint . --fix`

## Environment Variables

These can also be set in a `.env` file in the root directory.

| Name                  | Description                          |
|-----------------------|--------------------------------------|
| VITE_AT_CLIENT_ID     | Guid for target AusTrakka client app |
| VITE_AT_TENANT_ID     | Guid for target Azure Tenant         |
| VITE_REACT_API_URL    | The backend API url                  |
| VITE_API_SCOPE        | Scope URI for API application        |
