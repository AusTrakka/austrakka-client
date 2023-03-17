# austrakka-client

## Linting code

Run the following to lint code: `npm run lint`.

We should endeavour to get this error/warning list down to 0.
An `import/no-unresolved` error has already been the cause of a breaking build on Linux systems

## Environment Variables

Defaults are set in `.env`. These can be overriden by the calling shell.
I have omitted storing `VITE_AT_CLIENT_ID`, `VITE_AT_TENANT_ID` and `VITE_API_SCOPE` in the defaults for a few reasons:
1. We shouldn't be making these public for no reason
2. For anyone else looking at the project, these would not be relevant.
3. We should get used to setting these values now; the new infra will have different values for each environment, including individual user development environments

Note: Subscription key has been included in the defaults as it is meaningless and will not
be relevant in the new infra.

| Name                  | Description                          |
|-----------------------|--------------------------------------|
| VITE_AT_CLIENT_ID     | Guid for target AusTrakka client app |
| VITE_AT_TENANT_ID     | Guid for target Azure Tenant         |
| VITE_REACT_API_URL    | The backend API url                  |
| VITE_SUBSCRIPTION_KEY | The subscription key for APIM        |
| VITE_API_SCOPE        | Scope URI for API application        |
