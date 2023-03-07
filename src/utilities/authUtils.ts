import { useState } from "react";
import { InteractionRequiredAuthError } from "@azure/msal-browser"
import { msalInstance } from "../main";
import { loginRequest, msalConfig } from "../config/authConfig"

// Returns valid token or generates a new valid token
export async function getToken() {
    const currentAccount = msalInstance.getActiveAccount();

    if (currentAccount) {
        const accessTokenRequest = {
            scopes: ["api://df125604-3b75-46d3-a8ea-e54dc3b5e402/AAP-AusTrakka-API"],
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
