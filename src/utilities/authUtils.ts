import { InteractionRequiredAuthError } from "@azure/msal-browser"
import { msalInstance } from "../main";

// Returns valid token or generates a new valid token
export async function getToken() {
    const currentAccount = msalInstance.getActiveAccount();

    if (currentAccount) {
        const accessTokenRequest = {
            scopes: [import.meta.env.VITE_API_SCOPE],
            account: currentAccount,
        };
        const accessToken = msalInstance
        .acquireTokenSilent(accessTokenRequest)
        .then((accessTokenResponse) => {
            return accessTokenResponse.accessToken
        })
        .catch((error) => {
          if (error instanceof InteractionRequiredAuthError) {
            msalInstance
              .acquireTokenPopup(accessTokenRequest)
              .then(function (accessTokenResponse) {
                return accessTokenResponse.accessToken
              })
              .catch(function (error) {
                console.log(error);
              });
          }
          console.log(error);
          return null;
        });
        return accessToken;
    } 
    return null
}
