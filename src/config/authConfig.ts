import { Configuration, LogLevel } from '@azure/msal-browser'

export const msalConfig: Configuration = {
    auth: {
      clientId: "44b20f67-a4ca-426b-86a5-87de8e5d7c93",
      authority: "https://login.microsoftonline.com/cbc64d35-05df-4b87-a701-5d0b7e04d5c8",
      redirectUri: "/",
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: "sessionStorage", 
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
  export const loginRequest = {
   scopes: ["User.Read"],
  };
  
  // Add the endpoints here for Microsoft Graph API services you'd like to use.
  export const graphConfig = {
      graphMeEndpoint: ""
  };
