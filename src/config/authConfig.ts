import { Configuration, RedirectRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AT_TENANT_ID}`,
    redirectUri: '/',
    postLogoutRedirectUri: '/',
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  /* system: {
      loggerOptions: {
        loggerCallback: (level: any, message: any, containsPII: any) => {
          console.log(message)
        },
        logLevel: LogLevel.Verbose,
      }
    } */
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: RedirectRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE],
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: '',
};
