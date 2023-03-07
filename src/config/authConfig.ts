import { Configuration, LogLevel } from '@azure/msal-browser'

export const msalConfig: Configuration = {
    auth: {
      clientId: "16292c74-3a1d-4664-9f65-edb167bf199b",
      authority: "https://login.microsoftonline.com/0e5bf3cf-1ff4-46b7-9176-52c538c22a4d",
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
